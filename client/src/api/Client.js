import axios from "axios";

export const api = axios.create({
    // Production requests must go through the Vercel /api rewrite. Calling
    // Render directly makes the auth cookies third-party and browsers can
    // withhold them, causing every protected request to return 401.
    baseURL: import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:3000/api"),
    timeout: 10000,
    withCredentials: true,
    headers: { "Content-Type": "application/json" },
});

let refreshRequest;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const request = error.config;
        if (error.response?.status !== 401 || request?._retry || request?.url?.includes("/auth/")) return Promise.reject(error);
        request._retry = true;
        refreshRequest ||= api.post("/auth/refresh").finally(() => { refreshRequest = undefined; });
        try {
            await refreshRequest;
            return api(request);
        } catch (refreshError) {
            return Promise.reject(refreshError);
        }
    },
);
