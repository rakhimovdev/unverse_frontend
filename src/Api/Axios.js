import axios from "axios";
import { getStoredToken } from "../utils/authStorage";

const baseURL =
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === "development"
        ? "http://localhost:5000/"
        : "https://unverse-backend-1.onrender.com/");

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
