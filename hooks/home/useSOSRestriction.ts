import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

// ─── AsyncStorage Keys ────────────────────────────────────────────────────────
const KEY_IS_PAUSED = 'sos_restriction_is_paused';
const KEY_PAUSE_END_TIME = 'sos_restriction_pause_end_time';
const KEY_LAST_TRIGGER_TIME = 'sos_restriction_last_trigger_time';
const KEY_COOLDOWN_DURATION = 'sos_restriction_cooldown_duration';

const DEFAULT_COOLDOWN_MS = 600_000; // 10 minutes

// ─── Types ────────────────────────────────────────────────────────────────────
interface SOSAllowedResult {
    allowed: boolean;
    reason?: 'paused' | 'cooldown';
}

export interface UseSOSRestrictionReturn {
    /** Call before any AUTOMATED trigger. Manual triggers must NOT call this. */
    isSOSAllowed: () => SOSAllowedResult;
    /** Pauses automated SOS for the given duration in milliseconds. */
    pauseSOS: (durationMs: number) => Promise<void>;
    /** Immediately resumes automated SOS (clears pause). */
    resumeSOS: () => Promise<void>;
    /** Record that an automated SOS just fired (resets cooldown clock). */
    recordSOSTrigger: () => Promise<void>;
    /** Milliseconds remaining in an active pause (0 if not paused). */
    remainingPauseMs: number;
    /** Milliseconds remaining in an active post-trigger cooldown (0 if ready). */
    cooldownRemainingMs: number;
    /** True if a user-initiated pause is currently active. */
    isCurrentlyPaused: boolean;
    /** The configured cooldown duration in ms. */
    cooldownDuration: number;
    /** Update the cooldown duration (persisted). */
    setCooldownDuration: (ms: number) => Promise<void>;
}

export const useSOSRestriction = (): UseSOSRestrictionReturn => {
    const [pauseEndTime, setPauseEndTime] = useState<number>(0);
    const [lastTriggerTime, setLastTriggerTime] = useState<number>(0);
    const [cooldownDuration, setCooldownDurationState] = useState<number>(DEFAULT_COOLDOWN_MS);

    // Live countdown tickers (updated every second)
    const [remainingPauseMs, setRemainingPauseMs] = useState(0);
    const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);

    const tickerRef = useRef<NodeJS.Timeout | null>(null);

    // ─── Load persisted state on mount ─────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const [
                    rawPaused,
                    rawPauseEnd,
                    rawLastTrigger,
                    rawCooldown,
                ] = await AsyncStorage.multiGet([
                    KEY_IS_PAUSED,
                    KEY_PAUSE_END_TIME,
                    KEY_LAST_TRIGGER_TIME,
                    KEY_COOLDOWN_DURATION,
                ]);

                const storedPauseEnd = rawPauseEnd[1] ? parseInt(rawPauseEnd[1], 10) : 0;
                const storedLastTrigger = rawLastTrigger[1] ? parseInt(rawLastTrigger[1], 10) : 0;
                const storedCooldown = rawCooldown[1] ? parseInt(rawCooldown[1], 10) : DEFAULT_COOLDOWN_MS;
                const storedIsPaused = rawPaused[1] === 'true';

                // Restore only if still meaningful — if pause already expired, clean up
                const now = Date.now();
                if (storedIsPaused && storedPauseEnd > now) {
                    setPauseEndTime(storedPauseEnd);
                } else if (storedIsPaused && storedPauseEnd <= now) {
                    // Pause expired while app was closed — clean up silently
                    await AsyncStorage.multiRemove([KEY_IS_PAUSED, KEY_PAUSE_END_TIME]);
                }

                setLastTriggerTime(storedLastTrigger);
                setCooldownDurationState(storedCooldown);

            } catch (err) {
                // ⚠️ Fail OPEN — if we can't read, we do NOT block SOS
                console.log('⚠️ [SOSRestriction] AsyncStorage read failed — failing open:', err);
            }
        })();
    }, []);

    // ─── Live 1-second countdown ticker ────────────────────────────────────────
    useEffect(() => {
        if (tickerRef.current) clearInterval(tickerRef.current);

        tickerRef.current = setInterval(() => {
            const now = Date.now();

            const pauseLeft = Math.max(0, pauseEndTime - now);
            setRemainingPauseMs(pauseLeft);

            const cooldownEnd = lastTriggerTime + cooldownDuration;
            const cooldownLeft = Math.max(0, cooldownEnd - now);
            setCooldownRemainingMs(cooldownLeft);

            // Auto-clear pause state when it expires
            if (pauseEndTime > 0 && pauseLeft === 0) {
                setPauseEndTime(0);
                AsyncStorage.multiRemove([KEY_IS_PAUSED, KEY_PAUSE_END_TIME]).catch(() => {});
            }
        }, 1000) as unknown as NodeJS.Timeout;

        return () => {
            if (tickerRef.current) clearInterval(tickerRef.current);
        };
    }, [pauseEndTime, lastTriggerTime, cooldownDuration]);

    // ─── Core restriction check (synchronous — reads from state, not storage) ──
    const isSOSAllowed = useCallback((): SOSAllowedResult => {
        const now = Date.now();

        // Check active pause
        if (pauseEndTime > 0 && now < pauseEndTime) {
            return { allowed: false, reason: 'paused' };
        }

        // Check post-trigger cooldown
        if (lastTriggerTime > 0 && now < lastTriggerTime + cooldownDuration) {
            return { allowed: false, reason: 'cooldown' };
        }

        return { allowed: true };
    }, [pauseEndTime, lastTriggerTime, cooldownDuration]);

    // ─── Pause automated SOS ──────────────────────────────────────────────────
    const pauseSOS = useCallback(async (durationMs: number) => {
        const endTime = Date.now() + durationMs;
        setPauseEndTime(endTime);
        try {
            await AsyncStorage.multiSet([
                [KEY_IS_PAUSED, 'true'],
                [KEY_PAUSE_END_TIME, endTime.toString()],
            ]);
        } catch (err) {
            console.log('⚠️ [SOSRestriction] Failed to persist pause:', err);
        }
    }, []);

    // ─── Resume automated SOS ────────────────────────────────────────────────
    const resumeSOS = useCallback(async () => {
        setPauseEndTime(0);
        try {
            await AsyncStorage.multiRemove([KEY_IS_PAUSED, KEY_PAUSE_END_TIME]);
        } catch (err) {
            console.log('⚠️ [SOSRestriction] Failed to clear pause:', err);
        }
    }, []);

    // ─── Record that an automated trigger just fired ──────────────────────────
    const recordSOSTrigger = useCallback(async () => {
        const now = Date.now();
        setLastTriggerTime(now);
        try {
            await AsyncStorage.setItem(KEY_LAST_TRIGGER_TIME, now.toString());
        } catch (err) {
            console.log('⚠️ [SOSRestriction] Failed to persist trigger time:', err);
        }
    }, []);

    // ─── Update cooldown duration ─────────────────────────────────────────────
    const setCooldownDuration = useCallback(async (ms: number) => {
        setCooldownDurationState(ms);
        try {
            await AsyncStorage.setItem(KEY_COOLDOWN_DURATION, ms.toString());
        } catch (err) {
            console.log('⚠️ [SOSRestriction] Failed to persist cooldown duration:', err);
        }
    }, []);

    // ─── Derived state ────────────────────────────────────────────────────────
    const isCurrentlyPaused = pauseEndTime > 0 && Date.now() < pauseEndTime;

    return {
        isSOSAllowed,
        pauseSOS,
        resumeSOS,
        recordSOSTrigger,
        remainingPauseMs,
        cooldownRemainingMs,
        isCurrentlyPaused,
        cooldownDuration,
        setCooldownDuration,
    };
};
