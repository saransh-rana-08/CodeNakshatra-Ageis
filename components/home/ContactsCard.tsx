import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Contact } from '../../services/contactService';

interface ContactsCardProps {
    contacts: Contact[];
    contactName: string;
    setContactName: (name: string) => void;
    contactPhone: string;
    setContactPhone: (phone: string) => void;
    handleAddContact: () => void;
    handleDeleteContact: (id: number) => void;
}

export function ContactsCard({
    contacts, contactName, setContactName, contactPhone, setContactPhone,
    handleAddContact, handleDeleteContact
}: ContactsCardProps) {
    return (
        <View style={[styles.card, styles.contactsCard]}>
            <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                    <Text style={styles.cardIconText}>📞</Text>
                </View>
                <View>
                    <Text style={styles.cardTitle}>Emergency Contacts</Text>
                    <Text style={styles.cardSubtitle}>
                        {contacts.length} contact{contacts.length !== 1 ? 's' : ''} configured
                    </Text>
                </View>
            </View>

            {/* Contacts List */}
            {contacts.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateIcon}>👥</Text>
                    <Text style={styles.emptyStateTitle}>No Contacts</Text>
                    <Text style={styles.emptyStateText}>Add emergency contacts to receive SOS alerts</Text>
                </View>
            ) : (
                <View style={styles.contactsList}>
                    {contacts.map((c) => (
                        <TouchableOpacity
                            key={c.id}
                            style={styles.contactItem}
                            onPress={() => handleDeleteContact(c.id)}
                        >
                            <View style={styles.contactAvatar}>
                                <Text style={styles.contactAvatarText}>
                                    {c.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactName}>{c.name}</Text>
                                <Text style={styles.contactPhone}>{c.phoneNumber}</Text>
                            </View>
                            <View style={styles.contactAction}>
                                <Text style={styles.deleteText}>Remove</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Add Contact Form */}
            <View style={styles.addContactForm}>
                <Text style={styles.formTitle}>Add New Contact</Text>
                <View style={styles.formRow}>
                    <TextInput
                        style={[styles.input, styles.flex1]}
                        placeholder="Full Name"
                        placeholderTextColor="#94a3b8"
                        value={contactName}
                        onChangeText={setContactName}
                    />
                    <TextInput
                        style={[styles.input, styles.flex1]}
                        placeholder="Phone Number"
                        placeholderTextColor="#94a3b8"
                        value={contactPhone}
                        onChangeText={setContactPhone}
                        keyboardType="phone-pad"
                    />
                </View>
                <TouchableOpacity style={styles.addButton} onPress={handleAddContact}>
                    <Text style={styles.addButtonText}>Add Contact</Text>
                </TouchableOpacity>
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
    contactsCard: { borderLeftWidth: 4, borderLeftColor: "#10b981" },
    cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    cardIcon: {
        width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(59, 130, 246, 0.1)",
        alignItems: "center", justifyContent: "center", marginRight: 12,
    },
    cardIconText: { fontSize: 18 },
    cardTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
    cardSubtitle: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
    emptyState: { alignItems: 'center', paddingVertical: 32 },
    emptyStateIcon: { fontSize: 48, marginBottom: 12 },
    emptyStateTitle: { color: "#e2e8f0", fontSize: 16, fontWeight: '600', marginBottom: 4 },
    emptyStateText: { color: "#94a3b8", fontSize: 12, textAlign: 'center' },
    contactsList: { marginBottom: 20 },
    contactItem: {
        flexDirection: "row", alignItems: "center", paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: "#334155",
    },
    contactAvatar: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: "#3b82f6",
        alignItems: "center", justifyContent: "center", marginRight: 12,
    },
    contactAvatarText: { color: "white", fontSize: 16, fontWeight: "600" },
    contactInfo: { flex: 1 },
    contactName: { color: "#f8fafc", fontSize: 15, fontWeight: "600" },
    contactPhone: { color: "#94a3b8", fontSize: 13, marginTop: 2 },
    contactAction: {},
    deleteText: { color: "#ef4444", fontSize: 12, fontWeight: '600' },
    addContactForm: {
        backgroundColor: "#0f172a", borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: "#334155",
    },
    formTitle: { color: "#e2e8f0", fontSize: 14, fontWeight: '600', marginBottom: 12 },
    formRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    input: {
        backgroundColor: "#1e293b", borderRadius: 12, borderWidth: 1,
        borderColor: "#334155", paddingHorizontal: 16, paddingVertical: 12,
        color: "white", fontSize: 14,
    },
    flex1: { flex: 1 },
    addButton: {
        backgroundColor: "#10b981", borderRadius: 12, paddingVertical: 14, alignItems: "center",
        shadowColor: "#10b981", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    addButtonText: { color: "white", fontWeight: "700", fontSize: 14 },
});
