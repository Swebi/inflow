import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
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
  googleConnected: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  connectGoogle: () => Promise<void>;
  checkGoogleStatus: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = "http://localhost:8000/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);

  const checkGoogleStatus = useCallback(
    async (authToken?: string) => {
      const t = authToken ?? token;
      if (!t) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/google/status`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        setGoogleConnected(response.data.data.connected === true);
      } catch {
        setGoogleConnected(false);
      }
    },
    [token]
  );

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
        const storedToken =
          typeof stored.authToken === "string" ? stored.authToken : null;
        if (storedToken) {
          setToken(storedToken);
          try {
            const response = await axios.get(`${API_BASE_URL}/auth/me`, {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            setUser(response.data.data);
            await checkGoogleStatus(storedToken);
          } catch {
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

  // Listen for Google auth completion from background script
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message?.action === "googleAuthCompleted") {
        checkGoogleStatus();
      }
    };
    browser.runtime.onMessage.addListener(handleMessage);
    return () => browser.runtime.onMessage.removeListener(handleMessage);
  }, [checkGoogleStatus]);

  const login = async (email: string, password: string) => {
    const response = await axios
      .post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
      })
      .catch((error) => {
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.message || "Failed to login");
        }
        throw new Error("An unexpected error occurred");
      });

    const { user: userData, token: authToken } = response.data.data;
    setUser(userData);
    setToken(authToken);
    if (browser.storage?.local) {
      await browser.storage.local.set({ authToken });
    }
    await checkGoogleStatus(authToken);
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await axios
      .post(`${API_BASE_URL}/auth/register`, {
        email,
        password,
        name,
      })
      .catch((error) => {
        if (axios.isAxiosError(error)) {
          throw new Error(error.response?.data?.message || "Failed to register");
        }
        throw new Error("An unexpected error occurred");
      });

    const { user: userData, token: authToken } = response.data.data;
    setUser(userData);
    setToken(authToken);
    if (browser.storage?.local) {
      await browser.storage.local.set({ authToken });
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setGoogleConnected(false);
    if (browser.storage?.local) {
      await browser.storage.local.remove("authToken");
    }
  };

  const connectGoogle = async () => {
    if (!token) throw new Error("Not authenticated");

    const response = await axios.get(`${API_BASE_URL}/google/auth`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { authUrl } = response.data.data;
    const tab = await browser.tabs.create({ url: authUrl });

    // When the auth tab closes, re-check status
    const handleTabRemoved = async (tabId: number) => {
      if (tabId === tab.id) {
        browser.tabs.onRemoved.removeListener(handleTabRemoved);
        await checkGoogleStatus();
      }
    };
    browser.tabs.onRemoved.addListener(handleTabRemoved);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        googleConnected,
        login,
        register,
        logout,
        connectGoogle,
        checkGoogleStatus,
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
