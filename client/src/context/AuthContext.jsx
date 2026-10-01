import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/endpoints.js";
import { getGoogleIdToken } from "../config/firebase.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await authApi.session();
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    setUser(data.user);
    return data.user;
  };

  const loginWithGoogle = async () => {
    const idToken = await getGoogleIdToken();
    const { data } = await authApi.google(idToken);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const isAdmin = user?.role === "admin";
  const isSuper = isAdmin && !!user?.isSuperAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, isSuper, login, register, loginWithGoogle, logout, refreshMe, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const homePathFor = (user) => (user?.role === "admin" ? "/admin" : "/dashboard");
