import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { browser } from "wxt/browser";

interface User {
  id: string;
  email: string;
  name?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = "http://localhost:8000/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load token from storage on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        if (!browser.storage?.local) {
          console.warn("Storage API not available");
          setLoading(false);
          return;
        }
        const stored = await browser.storage.local.get("authToken");
        if (stored.authToken) {
          setToken(stored.authToken);
          // Verify token by fetching user info
          try {
            const response = await axios.get(`${API_BASE_URL}/auth/me`, {
              headers: {
                Authorization: `Bearer ${stored.authToken}`,
              },
            });
            setUser(response.data);
          } catch (error) {
            // Token is invalid, clear it
            if (browser.storage?.local) {
              await browser.storage.local.remove("authToken");
            }
            setToken(null);
          }
        }
      } catch (error) {
        console.error("Error loading auth:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      });

      const { user: userData, token: authToken } = response.data;
      setUser(userData);
      setToken(authToken);
      if (browser.storage?.local) {
        await browser.storage.local.set({ authToken });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.error || "Failed to login"
        );
      }
      throw new Error("An unexpected error occurred");
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email,
        password,
        name,
      });

      const { user: userData, token: authToken } = response.data;
      setUser(userData);
      setToken(authToken);
      if (browser.storage?.local) {
        await browser.storage.local.set({ authToken });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.error || "Failed to register"
        );
      }
      throw new Error("An unexpected error occurred");
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    if (browser.storage?.local) {
      await browser.storage.local.remove("authToken");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
