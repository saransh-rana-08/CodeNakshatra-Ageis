import { Audio } from 'expo-av';
import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { SOSService } from '../../services/sosService';

export const useAudioRecording = () => {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const recordingRef = useRef<Audio.Recording | null>(null);

    const startRecording = useCallback(async () => {
        try {
            console.log("🎙 Requesting microphone permission (SOS)...");
            const permission = await Audio.requestPermissionsAsync();
            if (!permission.granted) {
                Alert.alert("Permission required", "Microphone access is needed to record evidence.");
                return false;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            let recordingObject = null;
            for (let i = 0; i < 3; i++) {
                try {
                    const { recording } = await Audio.Recording.createAsync(
                        Audio.RecordingOptionsPresets.HIGH_QUALITY
                    );
                    recordingObject = recording;
                    break;
                } catch (e) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            }

            if (!recordingObject) {
                throw new Error("Failed to start recording after 3 attempts");
            }

            setRecording(recordingObject);
            recordingRef.current = recordingObject;
            console.log("🎙 Recording started");
            return true;
        } catch (err) {
            console.log("🎙 Recording error:", err);
            return false;
        }
    }, []);

    const stopRecording = useCallback(async (sosId: number | null, onUploaded?: (url: string) => void) => {
        try {
            const rec = recordingRef.current;
            if (!rec) return null;

            console.log("🎙 Stopping recording...");
            await rec.stopAndUnloadAsync();
            const uri = rec.getURI();
            console.log("📁 Audio file saved at:", uri);

            setRecording(null);
            recordingRef.current = null;

            if (uri) {
                if (sosId) {
                    // Start Background Upload
                    console.log("🎙 Uploading audio to Cloudinary...");
                    SOSService.uploadMedia(uri, 'audio')
                        .then((audioUrl) => {
                            console.log("✅ Audio uploaded:", audioUrl);
                            if (onUploaded) onUploaded(audioUrl);

                            // Immediately update the location with the URL
                            SOSService.updateLocation(sosId, undefined, undefined, undefined, audioUrl)
                                .catch(e => console.log("Failed to attach audioUrl to latest location:", e));
                        })
                        .catch((err) => {
                            console.log("❌ Audio upload failed:", err?.message || err);
                        });
                }
            }
            return uri;
        } catch (err) {
            console.log("🎙 Stop recording error:", err);
            return null;
        }
    }, []);

    return {
        isRecording: !!recording,
        startRecording,
        stopRecording,
    };
};
