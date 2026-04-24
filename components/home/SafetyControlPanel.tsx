import React, { useCallback, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { UseSOSRestrictionReturn } from '../../hooks/home/useSOSRestriction';

// ─── Preset Durations (pause) ─────────────────────────────────────────────────
const PAUSE_PRESETS = [
    { label: '15 min', ms: 15 * 60 * 1000 },
    { label: '30 min', ms: 30 * 60 * 1000 },
    { label: '1 hour', ms: 60 * 60 * 1000 },
] as const;

// ─── Preset Countdown Durations (pre-SOS alarm) ───────────────────────────────
const COUNTDOWN_PRESETS = [5, 8, 15, 30] as const;

// ─── Preset Cooldown Durations (post-trigger lockout) ─────────────────────────
const COOLDOWN_PRESETS = [
    { label: '5 min',  ms: 5 * 60 * 1000 },
    { label: '10 min', ms: 10 * 60 * 1000 },
    { label: '30 min', ms: 30 * 60 * 1000 },
    { label: '1 hr',   ms: 60 * 60 * 1000 },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatMs = (ms: number): string => {
    if (ms <= 0) return '0:00';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/** Format a cooldown duration in ms for display as a label (e.g. "10 min", "1 hr") */
const formatCooldownLabel = (ms: number): string => {
    const mins = Math.round(ms / 60_000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.round(ms / 3_600_000);
    return `${hrs} hr`;
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface SafetyControlPanelProps {
    restriction: UseSOSRestrictionReturn;
    /** Pass true while tracking is active to show the cooldown indicator */
    isTracking: boolean;
}

export function SafetyControlPanel({ restriction, isTracking }: SafetyControlPanelProps) {
    const {
        isSOSAllowed,
        pauseSOS,
        resumeSOS,
        isCurrentlyPaused,
        remainingPauseMs,
        cooldownRemainingMs,
        sosCountdownSecs,
        setSosCountdownSecs,
        cooldownDuration,
        setCooldownDuration,
    } = restriction;

    const [customMinutes, setCustomMinutes] = useState('');
    const [customModalVisible, setCustomModalVisible] = useState(false);
    // Separate state for the cooldown-duration custom modal
    const [cooldownCustomMinutes, setCooldownCustomMinutes] = useState('');
    const [cooldownModalVisible, setCooldownModalVisible] = useState(false);

    // ─── Derived state ────────────────────────────────────────────────────────
    const sosStatus = isSOSAllowed();
    const isCooldown = sosStatus.reason === 'cooldown' && cooldownRemainingMs > 0;

    // ─── Determine panel visual state ─────────────────────────────────────────
    let panelState: 'active' | 'paused' | 'cooldown';
    if (isCurrentlyPaused) panelState = 'paused';
    else if (isCooldown) panelState = 'cooldown';
    else panelState = 'active';

    const stateConfig = {
        active: {
            borderColor: '#22c55e',
            dotColor: '#22c55e',
            label: 'Auto-SOS Active',
            labelColor: '#22c55e',
            icon: '🛡️',
            bgColor: 'rgba(34,197,94,0.08)',
        },
        paused: {
            borderColor: '#f59e0b',
            dotColor: '#f59e0b',
            label: 'Auto-SOS Paused',
            labelColor: '#f59e0b',
            icon: '⏸️',
            bgColor: 'rgba(245,158,11,0.08)',
        },
        cooldown: {
            borderColor: '#6b7280',
            dotColor: '#6b7280',
            label: 'Cooldown Active',
            labelColor: '#94a3b8',
            icon: '⏳',
            bgColor: 'rgba(107,114,128,0.08)',
        },
    }[panelState];

    // ─── Actions ──────────────────────────────────────────────────────────────
    const handlePresetPause = useCallback(async (ms: number) => {
        await pauseSOS(ms);
    }, [pauseSOS]);

    const handleCustomPause = useCallback(async () => {
        const minutes = parseInt(customMinutes, 10);
        if (isNaN(minutes) || minutes <= 0 || minutes > 1440) {
            Alert.alert('Invalid Duration', 'Please enter a number between 1 and 1440 minutes.');
            return;
        }
        await pauseSOS(minutes * 60 * 1000);
        setCustomMinutes('');
        setCustomModalVisible(false);
    }, [customMinutes, pauseSOS]);

    const handleResume = useCallback(async () => {
        await resumeSOS();
    }, [resumeSOS]);

    return (
        <View style={[styles.card, { borderLeftColor: stateConfig.borderColor }]}>
            {/* ── Header ── */}
            <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: stateConfig.bgColor }]}>
                    <Text style={styles.cardIconText}>{stateConfig.icon}</Text>
                </View>
                <View style={styles.headerTextBlock}>
                    <Text style={styles.cardTitle}>Safety Controls</Text>
                    <Text style={styles.cardSubtitle}>Pause or manage automated triggers</Text>
                </View>
            </View>

            {/* ── Status Bar ── */}
            <View style={[styles.statusBar, { backgroundColor: stateConfig.bgColor, borderColor: stateConfig.borderColor }]}>
                <View style={[styles.statusDot, { backgroundColor: stateConfig.dotColor }]} />
                <Text style={[styles.statusLabel, { color: stateConfig.labelColor }]}>
                    {stateConfig.label}
                </Text>
                {panelState === 'paused' && remainingPauseMs > 0 && (
                    <Text style={styles.countdownBadge}>{formatMs(remainingPauseMs)}</Text>
                )}
                {panelState === 'cooldown' && cooldownRemainingMs > 0 && (
                    <Text style={[styles.countdownBadge, styles.countdownBadgeCooldown]}>
                        {formatMs(cooldownRemainingMs)}
                    </Text>
                )}
            </View>

            {/* ── Detail text for cooldown / pause ── */}
            {panelState === 'paused' && (
                <Text style={styles.detailText}>
                    Auto-detection (motion &amp; voice) is paused. Manual SOS button always works.
                </Text>
            )}
            {panelState === 'cooldown' && (
                <Text style={[styles.detailText, { color: '#6b7280' }]}>
                    Auto-SOS on cooldown after your last trigger. Manual SOS is always available.
                </Text>
            )}

            {/* ── Action Buttons ── */}
            {!isCurrentlyPaused ? (
                <>
                    <Text style={styles.sectionLabel}>Pause Auto-SOS For:</Text>
                    <View style={styles.presetRow}>
                        {PAUSE_PRESETS.map((preset) => (
                            <TouchableOpacity
                                key={preset.label}
                                style={styles.presetButton}
                                onPress={() => handlePresetPause(preset.ms)}
                                activeOpacity={0.75}
                            >
                                <Text style={styles.presetButtonText}>{preset.label}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={[styles.presetButton, styles.presetButtonCustom]}
                            onPress={() => setCustomModalVisible(true)}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.presetButtonText}>Custom</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <TouchableOpacity
                    style={styles.resumeButton}
                    onPress={handleResume}
                    activeOpacity={0.8}
                >
                    <Text style={styles.resumeButtonText}>▶ Resume Auto-SOS Now</Text>
                </TouchableOpacity>
            )}

            {/* ── Countdown Duration Picker ── */}
            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>Pre-SOS Alarm Duration:</Text>
            <View style={styles.countdownPickerRow}>
                {/* Quick chips */}
                {COUNTDOWN_PRESETS.map((secs) => (
                    <TouchableOpacity
                        key={secs}
                        style={[
                            styles.chipButton,
                            sosCountdownSecs === secs && styles.chipButtonActive,
                        ]}
                        onPress={() => setSosCountdownSecs(secs)}
                        activeOpacity={0.75}
                    >
                        <Text style={[
                            styles.chipText,
                            sosCountdownSecs === secs && styles.chipTextActive,
                        ]}>
                            {secs}s
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            {/* Fine-grained stepper */}
            <View style={styles.stepperRow}>
                <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setSosCountdownSecs(sosCountdownSecs - 1)}
                    activeOpacity={0.75}
                    disabled={sosCountdownSecs <= 5}
                >
                    <Text style={[styles.stepperBtnText, sosCountdownSecs <= 5 && styles.stepperBtnDisabled]}>
                        −
                    </Text>
                </TouchableOpacity>

                <View style={styles.stepperValueBox}>
                    <Text style={styles.stepperValue}>{sosCountdownSecs}</Text>
                    <Text style={styles.stepperUnit}>seconds</Text>
                </View>

                <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => setSosCountdownSecs(sosCountdownSecs + 1)}
                    activeOpacity={0.75}
                    disabled={sosCountdownSecs >= 60}
                >
                    <Text style={[styles.stepperBtnText, sosCountdownSecs >= 60 && styles.stepperBtnDisabled]}>
                        +
                    </Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.countdownHint}>
                Alarm plays for this long before SOS fires. Min 5s, max 60s.
            </Text>

            {/* ── Post-Trigger Cooldown Duration Picker ── */}
            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>Post-Trigger Cooldown:</Text>
            <Text style={[styles.detailText, { marginBottom: 10 }]}>
                After auto-SOS fires, new automated triggers are blocked for this long.
                Currently: <Text style={{ color: '#94a3b8', fontWeight: '700' }}>{formatCooldownLabel(cooldownDuration)}</Text>
            </Text>
            <View style={styles.countdownPickerRow}>
                {COOLDOWN_PRESETS.map((preset) => (
                    <TouchableOpacity
                        key={preset.ms}
                        style={[
                            styles.chipButton,
                            cooldownDuration === preset.ms && styles.chipButtonCooldownActive,
                        ]}
                        onPress={() => setCooldownDuration(preset.ms)}
                        activeOpacity={0.75}
                    >
                        <Text style={[
                            styles.chipText,
                            cooldownDuration === preset.ms && styles.chipTextCooldownActive,
                        ]}>
                            {preset.label}
                        </Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity
                    style={[
                        styles.chipButton,
                        styles.presetButtonCustom,
                        !COOLDOWN_PRESETS.some(p => p.ms === cooldownDuration) && styles.chipButtonCooldownActive,
                    ]}
                    onPress={() => setCooldownModalVisible(true)}
                    activeOpacity={0.75}
                >
                    <Text style={[
                        styles.chipText,
                        !COOLDOWN_PRESETS.some(p => p.ms === cooldownDuration) && styles.chipTextCooldownActive,
                    ]}>
                        Custom
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ── Cooldown Custom Duration Modal ── */}
            <Modal
                visible={cooldownModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCooldownModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Custom Cooldown Duration</Text>
                        <Text style={styles.modalSubtitle}>Minutes to lock out auto-triggers after an SOS fires (1–1440)</Text>

                        <TextInput
                            style={styles.minuteInput}
                            placeholderTextColor="#6b7280"
                            placeholder="e.g. 20"
                            keyboardType="number-pad"
                            value={cooldownCustomMinutes}
                            onChangeText={setCooldownCustomMinutes}
                            maxLength={4}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => { setCooldownModalVisible(false); setCooldownCustomMinutes(''); }}
                            >
                                <Text style={styles.modalBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnConfirm]}
                                onPress={async () => {
                                    const mins = parseInt(cooldownCustomMinutes, 10);
                                    if (isNaN(mins) || mins <= 0 || mins > 1440) {
                                        Alert.alert('Invalid Duration', 'Please enter a number between 1 and 1440 minutes.');
                                        return;
                                    }
                                    await setCooldownDuration(mins * 60 * 1000);
                                    setCooldownCustomMinutes('');
                                    setCooldownModalVisible(false);
                                }}
                            >
                                <Text style={[styles.modalBtnText, { color: '#fff', fontWeight: '700' }]}>
                                    Confirm
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── Custom Duration Modal ── */}
            <Modal
                visible={customModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setCustomModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Custom Pause Duration</Text>
                        <Text style={styles.modalSubtitle}>Enter duration in minutes (1–1440)</Text>

                        <TextInput
                            style={styles.minuteInput}
                            placeholderTextColor="#6b7280"
                            placeholder="e.g. 45"
                            keyboardType="number-pad"
                            value={customMinutes}
                            onChangeText={setCustomMinutes}
                            maxLength={4}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnCancel]}
                                onPress={() => { setCustomModalVisible(false); setCustomMinutes(''); }}
                            >
                                <Text style={styles.modalBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.modalBtnConfirm]}
                                onPress={handleCustomPause}
                            >
                                <Text style={[styles.modalBtnText, { color: '#fff', fontWeight: '700' }]}>
                                    Confirm
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#334155',
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    cardIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    cardIconText: { fontSize: 18 },
    headerTextBlock: { flex: 1 },
    cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
    cardSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 2 },

    // Status bar
    statusBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 12,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    statusLabel: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
    },
    countdownBadge: {
        backgroundColor: '#f59e0b',
        color: '#1a1a1a',
        fontSize: 13,
        fontWeight: '800',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 20,
        overflow: 'hidden',
        minWidth: 52,
        textAlign: 'center',
    },
    countdownBadgeCooldown: {
        backgroundColor: '#334155',
        color: '#94a3b8',
    },

    detailText: {
        color: '#64748b',
        fontSize: 12,
        lineHeight: 18,
        marginBottom: 14,
    },

    // Presets
    sectionLabel: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    presetRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    presetButton: {
        flex: 1,
        minWidth: 70,
        backgroundColor: '#334155',
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#475569',
    },
    presetButtonCustom: {
        backgroundColor: '#1e3a5f',
        borderColor: '#3b82f6',
    },
    presetButtonText: {
        color: '#e2e8f0',
        fontSize: 13,
        fontWeight: '600',
    },

    // Resume
    resumeButton: {
        backgroundColor: '#166534',
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#22c55e',
        marginTop: 4,
    },
    resumeButtonText: {
        color: '#22c55e',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.3,
    },

    // Countdown picker
    divider: {
        height: 1,
        backgroundColor: '#334155',
        marginVertical: 16,
    },
    countdownPickerRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    chipButton: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: '#334155',
        borderWidth: 1,
        borderColor: '#475569',
    },
    chipButtonActive: {
        backgroundColor: 'rgba(239,68,68,0.15)',
        borderColor: '#ef4444',
    },
    chipText: {
        color: '#94a3b8',
        fontSize: 14,
        fontWeight: '700',
    },
    chipTextActive: {
        color: '#ef4444',
    },
    // Cooldown chip active — use blue to distinguish from alarm (red)
    chipButtonCooldownActive: {
        backgroundColor: 'rgba(59,130,246,0.15)',
        borderColor: '#3b82f6',
    },
    chipTextCooldownActive: {
        color: '#3b82f6',
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#0f172a',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#334155',
        paddingVertical: 6,
        paddingHorizontal: 4,
        marginBottom: 10,
    },
    stepperBtn: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        backgroundColor: '#1e293b',
    },
    stepperBtnText: {
        color: '#f8fafc',
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 28,
    },
    stepperBtnDisabled: {
        color: '#334155',
    },
    stepperValueBox: {
        flex: 1,
        alignItems: 'center',
    },
    stepperValue: {
        color: '#ef4444',
        fontSize: 36,
        fontWeight: '900',
        lineHeight: 40,
    },
    stepperUnit: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: '600',
        marginTop: -2,
    },
    countdownHint: {
        color: '#475569',
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
    },

    // Custom duration modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalBox: {
        width: '100%',
        backgroundColor: '#1e293b',
        borderRadius: 20,
        padding: 28,
        borderWidth: 1,
        borderColor: '#334155',
    },
    modalTitle: {
        color: '#f8fafc',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 6,
    },
    modalSubtitle: {
        color: '#94a3b8',
        fontSize: 13,
        marginBottom: 20,
    },
    minuteInput: {
        backgroundColor: '#0f172a',
        borderWidth: 1,
        borderColor: '#475569',
        borderRadius: 12,
        color: '#f8fafc',
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        paddingVertical: 14,
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        borderWidth: 1,
    },
    modalBtnCancel: {
        backgroundColor: '#1e293b',
        borderColor: '#334155',
    },
    modalBtnConfirm: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    modalBtnText: {
        color: '#94a3b8',
        fontSize: 15,
        fontWeight: '600',
    },
});
