import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as Linking from 'expo-linking';
import { useCallback, useRef, useState } from 'react';

// Audio Recording Constants
const SAMPLE_RATE = 44100; // Standard for Whisper
const CHUNK_DURATION_MS = 3000; // 3 seconds chunks (better for phrases)
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || ""; // Load from env

// Trigger Phrases (English & Hindi)
const TRIGGER_PHRASES = [
    "help", "help me", "save me", "no", "leave me"
];

const SAFE_PHRASES = [
    "i am safe", "im safe", "safe"
];

interface VoiceSOSOptions {
    onKeywordDetected: (info: {
        keyword: string;
        type: 'trigger' | 'safe';
        confidence: number;
        timestamp: number;
    }) => void;
    onAudioRecorded?: (uri: string) => void;
    onError?: (error: any) => void;
    customSafeWords?: string[];
}

export default function useVoiceSOS(options: VoiceSOSOptions) {
    const { onKeywordDetected, onError } = options;
    const isListening = useRef(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const recordingRef = useRef<Audio.Recording | null>(null);
    const isProcessingRef = useRef(false);
    const shouldStopRef = useRef(false);
    const chunkTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 🔄 Keep track of latest callbacks/data to avoid stale closures
    const onKeywordDetectedRef = useRef(onKeywordDetected);
    onKeywordDetectedRef.current = onKeywordDetected;
    const customSafeWordsRef = useRef(options.customSafeWords || []);
    customSafeWordsRef.current = options.customSafeWords || [];

    // Helper: Safe Unload
    const safeUnload = async (recording: Audio.Recording | null) => {
        if (!recording) return;
        try {
            const status = await recording.getStatusAsync();
            if (status.canRecord || status.isRecording) {
                await recording.stopAndUnloadAsync();
            }
        } catch (e) {
            console.log("[VoiceSOS] Safe unload handled error:", e);
        }
    };

    // 1. Send to Cloud (Groq Whisper)
    const sendAudioToCloud = async (uri: string) => {
        try {
            if (!GROQ_API_KEY) {
                console.warn("[VoiceSOS] MISSING API KEY! Cannot transcribe.");
                return;
            }

            const formData = new FormData();
            // @ts-ignore
            formData.append('file', {
                uri: uri,
                type: 'audio/m4a',
                name: 'audio.m4a',
            });
            formData.append('model', 'whisper-large-v3');
            formData.append('language', 'en');
            
            const customWordsStr = customSafeWordsRef.current.join(", ");
            const prompt = `Emergency phrases: Help, Bachao, Madad, Save me. Safe phrases: I am safe, Cancel, ${customWordsStr}. Transcribe in English or Hinglish.`;
            formData.append('prompt', prompt);

            const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            const data = await response.json();
            if (data.text) {
                console.log('[VoiceSOS] Transcription:', data.text);
                checkTriggerPhrases(data.text);
            }
            if (data.error) {
                console.error('[VoiceSOS] Groq Error:', data.error.message);
            }

        } catch (error) {
            console.error('[VoiceSOS] Cloud API Error:', error);
        }
    };

    const checkTriggerPhrases = (text: string) => {
        if (!text) return;
        const lowerText = text.toLowerCase();
        const allSafePhrases = [...SAFE_PHRASES, ...customSafeWordsRef.current];
        const safeDetected = allSafePhrases.find(phrase => lowerText.includes(phrase.toLowerCase()));
        
        if (safeDetected) {
            console.log(`[VoiceSOS] 🛡 SAFE WORD DETECTED: "${safeDetected}"`);
            onKeywordDetectedRef.current({ keyword: safeDetected, type: 'safe', confidence: 1.0, timestamp: Date.now() });
            return;
        }

        const detected = TRIGGER_PHRASES.find(phrase => lowerText.includes(phrase));
        if (detected) {
            console.log(`[VoiceSOS] 🚨 TRIGGER DETECTED: "${detected}"`);
            onKeywordDetectedRef.current({ keyword: detected, type: 'trigger', confidence: 1.0, timestamp: Date.now() });
        }
    };

    // 3. Stop and Process Chunk
    const stopAndProcess = async (recording: Audio.Recording) => {
        if (isProcessingRef.current) return;
        
        try {
            isProcessingRef.current = true;
            setIsProcessing(true);

            await safeUnload(recording);
            const uri = recording.getURI();

            if (uri && !shouldStopRef.current) {
                sendAudioToCloud(uri); // Fire and forget upload for this chunk
                if (options.onAudioRecorded) options.onAudioRecorded(uri);
            }

        } catch (error) {
            console.error('[VoiceSOS] Error in stopAndProcess:', error);
        } finally {
            isProcessingRef.current = false;
            setIsProcessing(false);
            
            // Loop back if not stopped
            if (!shouldStopRef.current) {
                startListeningLoop();
            } else {
                isListening.current = false;
            }
        }
    };

    // 4. Main Listening Loop
    const startListeningLoop = useCallback(async () => {
        if (shouldStopRef.current) {
            isListening.current = false;
            return;
        }
        
        isListening.current = true;

        try {
            // 1. Initial Permission Check (Only if not granted)
            let { status } = await Audio.getPermissionsAsync();
            if (status !== 'granted') {
                const requested = await Audio.requestPermissionsAsync();
                if (requested.status !== 'granted') {
                    if (!requested.canAskAgain) Linking.openSettings();
                    onError?.("Microphone permission required.");
                    isListening.current = false;
                    return;
                }
            }

            // 2. Hardware initialization (Targeted try/catch)
            let recording: Audio.Recording;
            try {
                const result = await Audio.Recording.createAsync({
                    android: {
                        extension: '.m4a',
                        outputFormat: Audio.AndroidOutputFormat.MPEG_4,
                        audioEncoder: Audio.AndroidAudioEncoder.AAC,
                        sampleRate: SAMPLE_RATE,
                        numberOfChannels: 1,
                        bitRate: 128000,
                        // @ts-ignore
                        metering: true,
                    },
                    ios: {
                        extension: '.m4a',
                        outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
                        audioQuality: Audio.IOSAudioQuality.HIGH,
                        sampleRate: SAMPLE_RATE,
                        numberOfChannels: 1,
                        bitRate: 128000,
                        linearPCMBitDepth: 16,
                        linearPCMIsBigEndian: false,
                        linearPCMIsFloat: false,
                        // @ts-ignore
                        metering: true,
                    },
                    web: { mimeType: 'audio/webm', bitsPerSecond: 128000 },
                });
                recording = result.recording;
            } catch (err) {
                console.error("[VoiceSOS] Mic init error:", err);
                onError?.("Microphone is currently unavailable.");
                // Retry after a delay if not stopped
                if (!shouldStopRef.current) {
                    chunkTimeoutRef.current = setTimeout(startListeningLoop, 2000) as any;
                } else {
                    isListening.current = false;
                }
                return;
            }

            if (shouldStopRef.current) {
                await safeUnload(recording);
                isListening.current = false;
                return;
            }

            recordingRef.current = recording;

            // Start the next cycle timer
            chunkTimeoutRef.current = setTimeout(() => {
                stopAndProcess(recording);
            }, CHUNK_DURATION_MS) as any;

        } catch (error) {
            console.error('[VoiceSOS] Loop error:', error);
            isListening.current = false;
        }
    }, [onError]);

    // 5. Public Controls
    const stopListening = useCallback(async () => {
        console.log("[VoiceSOS] Stopping service...");
        shouldStopRef.current = true;
        
        if (chunkTimeoutRef.current) {
            clearTimeout(chunkTimeoutRef.current);
            chunkTimeoutRef.current = null;
        }

        if (recordingRef.current) {
            await safeUnload(recordingRef.current);
            recordingRef.current = null;
        }

        // Reset audio mode
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: false,
                playsInSilentModeIOS: false,
            });
        } catch (e) {}

        isListening.current = false;
        isProcessingRef.current = false;
        setIsProcessing(false);
    }, []);

    const start = useCallback(async () => {
        if (isListening.current) return;
        console.log("[VoiceSOS] Starting service...");
        
        shouldStopRef.current = false;
        
        // Set Audio Mode ONCE at start
        try {
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
                staysActiveInBackground: true, // Crucial for SOS
                interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                shouldDuckAndroid: true,
                interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                playThroughEarpieceAndroid: false,
            });
        } catch (e) {
            console.error("[VoiceSOS] Failed to set audio mode:", e);
        }

        startListeningLoop();
    }, [startListeningLoop]);

    return {
        isListening: isListening.current,
        isProcessing,
        startListening: start,
        stopListening,
        isModelReady: true,
    };
}
