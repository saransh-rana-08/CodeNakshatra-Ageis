import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface MotionCardProps {
    magnitude: string;
    threshold: number;
    cooldown: boolean;
    tracking: boolean;
}

export function MotionCard({ magnitude, threshold, cooldown, tracking }: MotionCardProps) {
    const magValue = parseFloat(magnitude);

    return (
        <View style={[styles.card, styles.motionCard]}>
            <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                    <Text style={styles.cardIconText}>📡</Text>
                </View>
                <View>
                    <Text style={styles.cardTitle}>Motion Detection</Text>
                    <Text style={styles.cardSubtitle}>Live accelerometer monitoring</Text>
                </View>
            </View>

            <View style={styles.motionContent}>
                <View style={styles.magnitudeContainer}>
                    <Text style={styles.motionValue}>{magnitude}</Text>
                    <Text style={styles.motionUnit}>g-force</Text>
                </View>

                <View style={styles.thresholdContainer}>
                    <Text style={styles.thresholdLabel}>Threshold: {threshold.toFixed(1)} g</Text>
                    <View style={styles.thresholdBar}>
                        <View
                            style={[
                                styles.thresholdFill,
                                {
                                    width: `${(Math.min(magValue, threshold * 1.5) / (threshold * 1.5)) * 100}%`,
                                    backgroundColor: magValue > threshold ? '#ef4444' : '#22c55e'
                                }
                            ]}
                        />
                    </View>
                </View>
            </View>

            <View style={styles.statusContainer}>
                <View style={styles.statusItem}>
                    <View style={[styles.statusDot, cooldown ? styles.statusDotWarning : styles.statusDotSuccess]} />
                    <Text style={styles.statusText}>{cooldown ? "Cooldown Active" : "Monitoring"}</Text>
                </View>
                <View style={styles.statusItem}>
                    <View style={[styles.statusDot, tracking ? styles.statusDotActive : styles.statusDotInactive]} />
                    <Text style={styles.statusText}>{tracking ? "Tracking Active" : "Tracking Ready"}</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#1e293b",
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#334155",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    motionCard: {
        borderLeftWidth: 4,
        borderLeftColor: "#3b82f6",
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    cardIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    cardIconText: { fontSize: 18 },
    cardTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
    cardSubtitle: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
    motionContent: { alignItems: 'center', marginVertical: 16 },
    magnitudeContainer: { alignItems: 'center', marginBottom: 16 },
    motionValue: {
        color: "#f97316",
        fontSize: 42,
        fontWeight: "800",
        textShadowColor: 'rgba(249, 115, 22, 0.3)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    motionUnit: { color: "#94a3b8", fontSize: 14, fontWeight: "600", marginTop: -4 },
    thresholdContainer: { width: '100%' },
    thresholdLabel: { color: "#cbd5e1", fontSize: 12, marginBottom: 8, textAlign: 'center' },
    thresholdBar: { height: 6, backgroundColor: "#334155", borderRadius: 3, overflow: 'hidden' },
    thresholdFill: { height: '100%', borderRadius: 3 },
    statusContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 },
    statusItem: { flexDirection: 'row', alignItems: 'center' },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusDotSuccess: { backgroundColor: '#22c55e' },
    statusDotWarning: { backgroundColor: '#f59e0b' },
    statusDotActive: { backgroundColor: '#ef4444' },
    statusDotInactive: { backgroundColor: '#6b7280' },
    statusText: { color: "#cbd5e1", fontSize: 11, fontWeight: '600' },
});
