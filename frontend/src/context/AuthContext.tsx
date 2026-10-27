import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  birthday?: string;
  phone_number?: string;
  avatar_url?: string;
  custom_id?: string;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (userData: User, tokenData: string, rememberMe: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (updatedFields: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLiveProfile = async (authToken: string) => {
    try {
      const res = await fetch('http://localhost:3000/user/profile', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const freshUser = await res.json();
        if (freshUser && freshUser.email) {
          setUser((prev) => {
            const merged = { ...(prev || {}), ...freshUser };
            AsyncStorage.setItem('user', JSON.stringify(merged)).catch(() => {});
            return merged;
          });
        }
      }
    } catch (e) {
      // Ignore background refresh errors
    }
  };

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        const rememberMe = await AsyncStorage.getItem('rememberMe');

        if (storedToken && storedUser) {
          if (rememberMe === 'true') {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            // Silently refresh profile from server to get latest avatar & details
            fetchLiveProfile(storedToken);
          } else {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('rememberMe');
          }
        }
      } catch (error) {
        console.error('Failed to load auth state', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const refreshUser = useCallback(async () => {
    const activeToken = token || (await AsyncStorage.getItem('token'));
    if (activeToken) {
      await fetchLiveProfile(activeToken);
    }
  }, [token]);

  const updateUser = useCallback(async (updatedFields: Partial<User>) => {
    setUser((prev) => {
      const merged = prev ? { ...prev, ...updatedFields } : (updatedFields as User);
      AsyncStorage.setItem('user', JSON.stringify(merged)).catch(() => {});
      return merged;
    });
  }, []);

  const signIn = async (userData: User, tokenData: string, rememberMe: boolean) => {
    setUser(userData);
    setToken(tokenData);
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('token', tokenData);
      await AsyncStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');
      // Fetch fresh profile in case server has additional fields like avatar_url
      fetchLiveProfile(tokenData);
    } catch (error) {
      console.error('Failed to save auth state', error);
    }
  };

  const signOut = async () => {
    setUser(null);
    setToken(null);
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('rememberMe');
    } catch (error) {
      console.error('Failed to clear auth state', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, signIn, signOut, refreshUser, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

