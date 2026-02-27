import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PreSOSOverlayProps {
    visible: boolean;
    countdown: number;
    onCancel: () => void;
}

export function PreSOSOverlay({ visible, countdown, onCancel }: PreSOSOverlayProps) {
    if (!visible) return null;

    return (
        <View style={styles.preSosOverlay}>
            <View style={styles.preSosBox}>
                <Text style={styles.preSosTitle}>🚨 EMERGENCY ALERT 🚨</Text>
                <Text style={styles.preSosText}>SOS will be sent in</Text>
                <Text style={styles.countdownText}>{countdown}</Text>
                <Text style={styles.preSosSubText}>
                    Say <Text style={styles.boldText}>"I AM SAFE"</Text> or tap Cancel
                </Text>

                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                    <Text style={styles.cancelButtonText}>CANCEL SOS</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    preSosOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.9)',
        zIndex: 1000,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    preSosBox: {
        width: '100%',
        backgroundColor: '#1e293b',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#ef4444',
    },
    preSosTitle: {
        color: '#ef4444',
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 16,
        letterSpacing: 1,
    },
    preSosText: {
        color: '#cbd5e1',
        fontSize: 16,
        marginBottom: 8,
    },
    countdownText: {
        color: 'white',
        fontSize: 80,
        fontWeight: '900',
        marginVertical: 8,
    },
    preSosSubText: {
        color: '#94a3b8',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 22,
    },
    boldText: {
        color: '#3b82f6',
        fontWeight: '700',
    },
    cancelButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        marginTop: 32,
        width: '100%',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
