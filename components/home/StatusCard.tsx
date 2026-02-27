import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatusCardProps {
    lastSOS: {
        time: string | null;
        backendOk: boolean | null;
        smsOk: boolean | null;
    };
}

const renderStatusBadge = (label: string, value: boolean | null) => {
    let text = "PENDING";
    let style = styles.badgePending;

    if (value === true) {
        text = "OK";
        style = styles.badgeOk;
    } else if (value === false) {
        text = "FAILED";
        style = styles.badgeFailed;
    }

    return (
        <View style={styles.badgeRow}>
            <Text style={styles.badgeLabel}>{label}</Text>
            <View style={[styles.badge, style]}>
                <Text style={styles.badgeText}>{text}</Text>
            </View>
        </View>
    );
};

export function StatusCard({ lastSOS }: StatusCardProps) {
    return (
        <View style={[styles.card, styles.statusCard]}>
            <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                    <Text style={styles.cardIconText}>🚨</Text>
                </View>
                <View>
                    <Text style={styles.cardTitle}>Last SOS Status</Text>
                    <Text style={styles.cardSubtitle}>
                        {lastSOS.time ? `Triggered at ${lastSOS.time}` : "No SOS events yet"}
                    </Text>
                </View>
            </View>

            <View style={styles.statusBadges}>
                {renderStatusBadge("Backend Service", lastSOS.backendOk)}
                {renderStatusBadge("SMS Notifications", lastSOS.smsOk)}
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
    statusCard: { borderLeftWidth: 4, borderLeftColor: "#f59e0b" },
    cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    cardIcon: {
        width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(59, 130, 246, 0.1)",
        alignItems: "center", justifyContent: "center", marginRight: 12,
    },
    cardIconText: { fontSize: 18 },
    cardTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
    cardSubtitle: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
    statusBadges: { marginTop: 8 },
    badgeRow: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#334155",
    },
    badgeLabel: { color: "#e2e8f0", fontSize: 14, fontWeight: "500" },
    badge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, minWidth: 80, alignItems: 'center' },
    badgeText: { color: "white", fontSize: 12, fontWeight: "700" },
    badgeOk: { backgroundColor: "#16a34a" },
    badgeFailed: { backgroundColor: "#dc2626" },
    badgePending: { backgroundColor: "#6b7280" },
});
