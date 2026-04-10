import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 5.0; // Default threshold from index.tsx

interface UseMotionDetectionProps {
    onTrigger: () => void;
    isActive: boolean; // Pre-SOS active or Tracking active (to prevent re-triggering)
}

export const useMotionDetection = ({ onTrigger, isActive }: UseMotionDetectionProps) => {
    const [data, setData] = useState({ x: 0, y: 0, z: 0 });
    const [cooldown, setCooldown] = useState(false);

    // We use refs to avoid stale closures in the Accelerometer listener
    const onTriggerRef = useRef(onTrigger);
    const isActiveRef = useRef(isActive);

    useEffect(() => {
        onTriggerRef.current = onTrigger;
        isActiveRef.current = isActive;
    }, [onTrigger, isActive]);

    useEffect(() => {
        console.log("📡 Starting accelerometer listener...");
        Accelerometer.setUpdateInterval(200);

        const subscription = Accelerometer.addListener((accelerometerData) => {
            setData(accelerometerData);

            const { x, y, z } = accelerometerData;
            const magnitude = Math.sqrt(x * x + y * y + z * z);

            if (magnitude > THRESHOLD && !cooldown && !isActiveRef.current) {
                console.log("🚨 Sudden motion detected:", magnitude);

                // Set cooldown locally to immediately throttle
                setCooldown(true);
                setTimeout(() => setCooldown(false), 5000);

                onTriggerRef.current();
            }
        });

        return () => {
            console.log("📡 Stopping accelerometer listener...");
            subscription && subscription.remove();
        };
    }, [cooldown]); // Only re-subscribe if cooldown changes, others handled by refs

    return {
        data,
        magnitude: Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z).toFixed(2),
        cooldown,
        THRESHOLD
    };
};
