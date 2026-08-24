import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://mini-hrms-2.onrender.com/api" : "http://localhost:3000/api"),
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