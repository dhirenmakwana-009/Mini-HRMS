import { createContext, createElement, useContext, useEffect, useState } from "react";
import { api } from "../api/Client";

/**
 * useAuth — stubbed auth hook.
 *
 * WIRE-UP INSTRUCTIONS (MERN backend):
 * 1. Point API_BASE_URL at your Express server (or use a Vite/CRA env var).
 * 2. Replace the mock block inside `login()` with the real fetch call.
 * 3. Decide how you want to store the token:
 *      - httpOnly cookie set by the server (recommended, most secure), or
 *      - localStorage/sessionStorage if you must access it from JS.
 * 4. If using cookies, add `credentials: "include"` to fetch and configure
 *    CORS + cookie options (sameSite, secure) on the Express side.
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/auth/me").then(({ data }) => setUser(data.user)).catch(() => setUser(null)).finally(() => setIsLoading(false));
  }, []);

  const login = async ({ email, password }) => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data.user);
      return data;
    } catch (requestError) {
      const message = requestError.response?.data?.error || "Invalid email or password";
      setError(message);
      throw new Error(message, { cause: requestError });
    } finally { setIsLoading(false); }
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } finally { setUser(null); }
  };

  return createElement(AuthContext.Provider, { value: { user, isLoading, error, setError, login, logout, isAuthenticated: Boolean(user) } }, children);
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
};