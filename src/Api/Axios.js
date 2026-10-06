import axios from "axios";
import { getStoredToken } from "../utils/authStorage";
import { API_URL } from "../config";

const Api = axios.create({ baseURL: API_URL });

Api.interceptors.request.use((config) => {
    const token = getStoredToken();

    if (token && !config.headers?.Authorization) {
        config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`
        };
    }

    return config;
});

export default Api;
