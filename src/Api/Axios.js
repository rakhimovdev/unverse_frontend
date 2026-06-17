import axios from "axios";
import { getStoredToken } from "../utils/authStorage";

const configuredBaseURL = process.env.REACT_APP_API_URL?.trim();
const isLocalDevelopmentApi = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(
    configuredBaseURL || ""
);

export const resolveApiBaseURL = () => {
    if (process.env.NODE_ENV === "development") {
        // Let the CRA dev server proxy local API traffic to avoid browser CORS issues.
        if (!configuredBaseURL || isLocalDevelopmentApi) {
            return "/";
        }
    }

    return configuredBaseURL || "https://unverse-backend-1.onrender.com/";
};

const baseURL = resolveApiBaseURL();

const Api = axios.create({ baseURL });

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
