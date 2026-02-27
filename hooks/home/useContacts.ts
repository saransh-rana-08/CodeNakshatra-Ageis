import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Contact, ContactService } from '../../services/contactService';

export const useContacts = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [contactName, setContactName] = useState("");
    const [contactPhone, setContactPhone] = useState("");

    const refreshContacts = useCallback(async () => {
        try {
            const data = await ContactService.getContacts();
            setContacts(data);
            console.log("📇 Loaded contacts:", data.map((c) => c.phoneNumber));
        } catch (err: any) {
            console.log("❌ Failed to load contacts:", err?.message || err);
        }
    }, []);

    const handleAddContact = async () => {
        if (!contactName.trim() || !contactPhone.trim()) {
            Alert.alert("Missing info", "Please enter both name and phone number.");
            return;
        }

        try {
            await ContactService.addContact(contactName.trim(), contactPhone.trim());
            setContactName("");
            setContactPhone("");
            await refreshContacts();
            Alert.alert("Added", "Emergency contact added successfully.");
        } catch (err: any) {
            console.log("❌ Failed to add contact:", err?.message || err);
            Alert.alert("Error", "Failed to add contact.");
        }
    };

    const handleDeleteContact = (id: number) => {
        Alert.alert(
            "Delete contact?",
            "Are you sure you want to remove this emergency contact?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            console.log("🗑 Deleting contact with id:", id);
                            await ContactService.deleteContact(id);
                            await refreshContacts();
                        } catch (err: any) {
                            console.log("❌ Failed to delete contact:", err?.message || err);
                            Alert.alert("Error", "Failed to delete contact.");
                        }
                    },
                },
            ]
        );
    };

    // Load on mount
    useEffect(() => {
        refreshContacts();
    }, [refreshContacts]);

    return {
        contacts,
        contactName,
        setContactName,
        contactPhone,
        setContactPhone,
        handleAddContact,
        handleDeleteContact,
    };
};
