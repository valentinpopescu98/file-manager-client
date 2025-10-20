import axios from "axios";
import { getAuthToken } from "../auth/jwt";
import { logoutAndPurge } from "../auth/logout";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

export const authApi = axios.create({
  baseURL: process.env.REACT_APP_API_SERVER_URL,
  withCredentials: false
});

export const api = axios.create({
    baseURL: process.env.REACT_APP_API_SERVER_URL,
    withCredentials: false
});

function validateToken() {
    const token = getAuthToken();
    if (token) {
        api.get("/api/auth/validate").catch(() => {
            // NO-OP: api interceptor will do logoutAndPurge()
        });
    } else {
        // No token -> logout
        logoutAndPurge("missing_token");
        return;
    }
}

function createLogoutListener() {
    let cleanup;
    try {
        const bc = new BroadcastChannel("auth");
        bc.onmessage = (ev) => {
            if (ev.data?.type === "logout") logoutAndPurge(ev.data.reason);
        };
        cleanup = () => bc.close();
    } catch {
        // Fallback on the storage event
        const onStorage = (e) => {
            if (e.key === "logout-event") logoutAndPurge("broadcast");
        };
        window.addEventListener("storage", onStorage);
        cleanup = () => window.removeEventListener("storage", onStorage);
    }

    return cleanup;
}

export function useAuthBootstrap() {
    const location = useLocation();

    // 1) Validate at mount if token exists and is valid
    useEffect(() => validateToken(), [location.pathname]);

    // 2) Listen for logout broadcast between tabs
    useEffect(() => createLogoutListener(), []);
}

// Add Authorization: Bearer <token>
api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (!token) {
        logoutAndPurge("missing-token");
        const err = new axios.CanceledError("No auth token");
        err.__handledAuth = true;
        return Promise.reject(err);
    }

    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// When 401/403 -> logout
let didLogout = false;
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err?.__handledAuth) {
            return Promise.reject(err);
        }

        const status = err?.response?.status;
        if (status === 401 || status === 403) {
            if (!didLogout) {
                didLogout = true;
                logoutAndPurge(status === 401 ? "unauthenticated" : "unauthorized");
            }
            
            const cancel = new axios.CanceledError("Logged out due to auth error");
            cancel.__handledAuth = true;
            return Promise.reject(cancel);
        }
        
        return Promise.reject(err);
    }
);

export default api;