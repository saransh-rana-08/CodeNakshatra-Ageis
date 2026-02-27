import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface SafeWordsModalProps {
    visible: boolean;
    onClose: () => void;
    customSafeWords: string[];
    newSafeWord: string;
    setNewSafeWord: (word: string) => void;
    addSafeWord: () => void;
    deleteSafeWord: (word: string) => void;
}

export function SafeWordsModal({
    visible, onClose, customSafeWords, newSafeWord, setNewSafeWord, addSafeWord, deleteSafeWord
}: SafeWordsModalProps) {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Manage Safe Words</Text>
                    <Text style={styles.modalSubtitle}>Say these words to cancel an SOS.</Text>

                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter word (e.g. 'False Alarm')"
                            placeholderTextColor="#64748b"
                            value={newSafeWord}
                            onChangeText={setNewSafeWord}
                        />
                        <TouchableOpacity style={styles.modalAddButton} onPress={addSafeWord}>
                            <Text style={styles.modalAddButtonText}>Add</Text>
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={customSafeWords}
                        keyExtractor={(item) => item}
                        style={styles.modalList}
                        renderItem={({ item }) => (
                            <View style={styles.modalListItem}>
                                <Text style={styles.modalListItemText}>{item}</Text>
                                <TouchableOpacity onPress={() => deleteSafeWord(item)}>
                                    <Text style={styles.modalDeleteIcon}>🗑</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        ListEmptyComponent={<Text style={styles.modalEmptyText}>No custom words added yet.</Text>}
                    />

                    <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
                        <Text style={styles.modalCloseButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: "#1e293b",
        borderRadius: 16,
        padding: 20,
        maxHeight: "80%",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
        marginBottom: 8,
        textAlign: "center",
    },
    modalSubtitle: {
        fontSize: 14,
        color: "#94a3b8",
        marginBottom: 20,
        textAlign: "center",
    },
    inputRow: {
        flexDirection: "row",
        marginBottom: 16,
    },
    modalInput: {
        flex: 1,
        backgroundColor: "#0f172a",
        borderRadius: 8,
        padding: 12,
        color: "white",
        borderWidth: 1,
        borderColor: "#334155",
        marginRight: 10,
    },
    modalAddButton: {
        backgroundColor: "#f97316",
        borderRadius: 8,
        paddingHorizontal: 16,
        justifyContent: "center",
    },
    modalAddButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    modalList: {
        marginBottom: 20,
    },
    modalListItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#0f172a",
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    modalListItemText: {
        color: "white",
        fontSize: 16,
    },
    modalDeleteIcon: {
        color: "#ef4444",
        fontSize: 18,
    },
    modalEmptyText: {
        color: "#64748b",
        textAlign: "center",
        fontStyle: "italic",
        marginTop: 20,
    },
    modalCloseButton: {
        backgroundColor: "#334155",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    modalCloseButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
});
