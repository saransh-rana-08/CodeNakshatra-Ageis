import * as Location from 'expo-location';
import { useCallback, useRef, useState } from 'react';
import { Config } from '../../constants/Config';
import { SOSService } from '../../services/sosService';

export const useLocationTracker = () => {
    const [tracking, setTracking] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const currentSosIdRef = useRef<number | null>(null);

    const sendLocationUpdate = useCallback(async () => {
        const sosId = currentSosIdRef.current;
        if (!sosId) return;

        try {
            const loc = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = loc.coords;

            await SOSService.updateLocation(sosId, latitude, longitude);
            // console.log("📍 Continuous location update sent:", latitude, longitude);
        } catch (err: any) {
            console.log("❌ Failed to send update location:", err?.message || err);
        }
    }, []);

    const startLocationTracking = useCallback((sosId: number) => {
        console.log("🔁 Starting location tracking for id:", sosId);
        setTracking(true);
        currentSosIdRef.current = sosId;

        // Start interval
        const id = setInterval(() => {
            sendLocationUpdate();
        }, Config.TIMEOUTS.LOCATION_UPDATE_INTERVAL) as unknown as NodeJS.Timeout;

        intervalRef.current = id;
    }, [sendLocationUpdate]);

    const stopLocationTracking = useCallback(() => {
        console.log("🛑 Stopping location tracking...");
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setTracking(false);
        // We delay clearing the SOS ID slightly to allow any final uploads to read it
        setTimeout(() => {
            currentSosIdRef.current = null;
        }, 5000);
    }, []);

    // Cleanup on unmount
    useCallback(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    return {
        tracking,
        startLocationTracking,
        stopLocationTracking,
        currentSosIdRef
    };
};
