import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/users/me`, {
        withCredentials: true,
      });
      setUser(response.data);
      return response.data;
    } catch (error) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    try {
      await axios.delete(`${API_URL}/users/sessions`, {
        withCredentials: true,
      });
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAdmin: Boolean(user?.isAdmin),
      isAuthenticated: Boolean(user),
      loading,
      refreshUser,
      setUser,
      logout,
    }),
    [user, loading, refreshUser, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

