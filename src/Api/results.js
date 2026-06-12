import axios from "./Axios";

export const fetchUserResults = async (params = {}) => {
    const response = await axios.get("/results", { params });
    return Array.isArray(response.data) ? response.data : [];
};

export const fetchResultDetail = async (id) => {
    const response = await axios.get(`/results/${id}`);
    return response.data;
};

export const fetchAdminResults = async (params = {}) => {
    const response = await axios.get("/admin/results", { params });
    return Array.isArray(response.data) ? response.data : [];
};
