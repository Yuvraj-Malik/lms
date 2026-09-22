import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "../api/endpoints.js";
import { signInWithGooglePopup } from "../config/firebase.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.user);
    } catch {
      setUser(null);
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
    const result = await signInWithGooglePopup();
    const fbUser = result.user;
    const idToken = await fbUser.getIdToken();
    const { data } = await authApi.googleAuth({
      idToken,
      email: fbUser.email,
      name: fbUser.displayName || fbUser.email.split("@")[0],
      avatar: fbUser.photoURL || "",
      googleId: fbUser.uid,
    });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshMe, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
