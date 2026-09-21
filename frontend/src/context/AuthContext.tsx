import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  birthday?: string;
  phone_number?: string;
  avatar_url?: string;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (userData: User, tokenData: string, rememberMe: boolean) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          } else {
            // They didn't select 'remember me', so clear their session on app start
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

  const signIn = async (userData: User, tokenData: string, rememberMe: boolean) => {
    setUser(userData);
    setToken(tokenData);
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('token', tokenData);
      await AsyncStorage.setItem('rememberMe', rememberMe ? 'true' : 'false');
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
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
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
