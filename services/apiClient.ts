import axios from 'axios';
import { Config } from '../constants/Config';

// A single configured axios instance for all app requests
export const apiClient = axios.create({
    baseURL: Config.API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default apiClient;
