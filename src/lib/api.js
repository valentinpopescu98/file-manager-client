import axios from "axios";
import { getAuthToken } from "../auth/jwt";
import { logoutAndPurge } from "../auth/logout";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_SERVER_URL,
    withCredentials: false
});

// Add Authorization: Bearer <token>
api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// When 401/403 -> logout
let didLogout = false;
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;
        if (!didLogout && (status === 401 || status === 403)) {
            didLogout = true;
            logoutAndPurge(status === 401 ? "unauthenticated" : "unauthorized");
            return new Promise(() => {});
        }
        return Promise.reject(err);
    }
);

export default api;