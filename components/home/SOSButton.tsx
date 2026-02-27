import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SOSButtonProps {
    tracking: boolean;
    onPress: () => void;
}

export function SOSButton({ tracking, onPress }: SOSButtonProps) {
    return (
        <View style={styles.sosContainer}>
            <TouchableOpacity
                style={[styles.sosButton, tracking && styles.sosButtonActive]}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <View style={styles.sosButtonInner}>
                    <Text style={styles.sosIcon}>
                        {tracking ? "🛑" : "🚨"}
                    </Text>
                    <Text style={styles.sosText}>
                        {tracking ? "STOP SOS" : "EMERGENCY SOS"}
                    </Text>
                    <Text style={styles.sosSubtext}>
                        {tracking ? "Tap to stop emergency" : "Tap or shake to trigger"}
                    </Text>
                </View>

                {tracking && <View style={styles.pulseRing} />}
                {tracking && <View style={[styles.pulseRing, styles.pulseRing2]} />}
            </TouchableOpacity>

            <Text style={styles.sosHint}>
                {tracking
                    ? "Emergency active - Location tracking and audio recording enabled"
                    : "System ready - Motion and voice detection active"}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    sosContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    sosButton: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: "#ef4444",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#ef4444",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 10,
        marginBottom: 16,
    },
    sosButtonActive: {
        backgroundColor: "#dc2626",
    },
    sosButtonInner: {
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    sosIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    sosText: {
        color: "white",
        fontSize: 18,
        fontWeight: "900",
        letterSpacing: 1,
        textAlign: "center",
    },
    sosSubtext: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 10,
        marginTop: 4,
        textAlign: 'center',
    },
    pulseRing: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        borderColor: '#ef4444',
        opacity: 0.6,
    },
    pulseRing2: {
        width: 180,
        height: 180,
        borderRadius: 90,
        opacity: 0.3,
    },
    sosHint: {
        color: "#94a3b8",
        fontSize: 12,
        textAlign: "center",
        lineHeight: 16,
        maxWidth: 280,
    },
});
