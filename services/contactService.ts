import { Config } from '../constants/Config';
import apiClient from './apiClient';

export interface Contact {
    id: number;
    name: string;
    phoneNumber: string;
    primaryContact: boolean;
}

const CONTACTS_URL = Config.endpoints.CONTACTS;

export const ContactService = {
    async getContacts(): Promise<Contact[]> {
        const response = await apiClient.get<Contact[]>(CONTACTS_URL);
        return response.data;
    },

    async addContact(name: string, phoneNumber: string): Promise<Contact> {
        const response = await apiClient.post<Contact>(CONTACTS_URL, {
            name,
            phoneNumber,
            primaryContact: false,
        });
        return response.data;
    },

    async deleteContact(id: number): Promise<void> {
        await apiClient.delete(`${CONTACTS_URL}/${id}`);
    }
};
