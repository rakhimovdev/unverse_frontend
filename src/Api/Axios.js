import axios from "axios";

const baseURL =
    process.env.REACT_APP_API_URL ||
    (process.env.NODE_ENV === "development"
        ? "http://localhost:5000/"
        : "https://unverse-backend-1.onrender.com/");

const Api = axios.create({ baseURL });

export default Api;
