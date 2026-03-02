
import { CloudinaryConfig } from '../constants/CloudinaryConfig';
import { Config } from '../constants/Config';
import apiClient from './apiClient';

const API_URL = Config.endpoints.SOS_TRIGGER;
const UPDATE_URL = Config.endpoints.UPDATE_LOCATION;

export interface SOSTriggerResponse {
    id: number;
    message: string;
    timestamp: string;
}

export const SOSService = {
    async triggerSOS(latitude: number, longitude: number): Promise<SOSTriggerResponse> {
        const response = await apiClient.post<SOSTriggerResponse>(API_URL, {
            latitude,
            longitude,
            contactNumber: Config.DEFAULTS.ENTITY_CONTACT_NUMBER,
            timestamp: new Date().toISOString(),
        });
        return response.data;
    },

    async updateLocation(
        id: number,
        latitude?: number,
        longitude?: number,
        mediaUrl?: string,
        audioUrl?: string
    ): Promise<void> {
        await apiClient.post(UPDATE_URL, {
            id,
            latitude,
            longitude,
            mediaUrl,
            audioUrl,
            contactNumber: Config.DEFAULTS.ENTITY_CONTACT_NUMBER,
            timestamp: new Date().toISOString(),
        });
    },

    async uploadMedia(uri: string, type: 'audio' | 'video'): Promise<string> {
        return this.uploadToCloudinaryWithRetries(uri, type, 3);
    },

    async uploadToCloudinaryWithRetries(uri: string, type: 'audio' | 'video', retriesLeft: number): Promise<string> {
        try {
            const url = `https://api.cloudinary.com/v1_1/${CloudinaryConfig.cloudName}/auto/upload`;

            const formData = new FormData();

            formData.append('file', {
                uri,
                type: type === 'audio' ? 'audio/m4a' : 'video/mp4',
                name: type === 'audio' ? 'sos-audio.m4a' : 'sos-video.mp4',
            } as any);

            formData.append('upload_preset', CloudinaryConfig.uploadPreset);
            formData.append('folder', 'sos-media');

            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Cloudinary upload failed: ${errorText}`);
            }

            const data = await response.json();
            return data.secure_url;

        } catch (error) {
            console.error(`Media upload failed. Retries left: ${retriesLeft - 1}`, error);
            if (retriesLeft > 1) {
                // Wait 2 seconds before retrying
                await new Promise(resolve => setTimeout(resolve, 2000));
                return this.uploadToCloudinaryWithRetries(uri, type, retriesLeft - 1);
            }
            throw new Error(`Media upload failed after retries: ${error}`);
        }
    }
};
