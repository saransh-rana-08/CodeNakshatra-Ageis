import axios from 'axios';
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
        const formData = new FormData();

        if (type === 'audio') {
            // @ts-ignore
            formData.append("file", {
                uri,
                name: `sos_audio_${Date.now()}.m4a`,
                type: "audio/m4a",
            });
        } else {
            // @ts-ignore
            formData.append("file", {
                uri,
                name: `sos_video_${Date.now()}.mp4`,
                type: "video/mp4",
            });
        }

        // We use raw axios here because headers: multipart/form-data doesn't play 
        // super nicely with global configs sometimes in React Native, 
        // though apiClient could be used if overridden. We keep it as axios for safety.
        const response = await axios.post(`${Config.API_BASE_URL}/api/media/upload`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return response.data.url;
    }
};
