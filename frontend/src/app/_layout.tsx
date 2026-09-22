import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useSegments, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AlertProvider } from '@/context/AlertContext';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const isIndex = !segments[0] || segments[0] === 'index';
    const isPublicGroup = isIndex || segments[0] === 'login' || segments[0] === 'forgot-password' || segments[0] === 'thanks';
    const inAuthGroup = !isPublicGroup;

    if (!user) {
      if (inAuthGroup) {
        router.replace('/login');
      }
    } else {
      const isMissingData = !user.first_name || !user.last_name || !user.birthday || !user.phone_number;
      
      const isAuthRoute = isIndex || segments[0] === 'login' || segments[0] === 'forgot-password';
      if (isAuthRoute) {
        router.replace(isMissingData ? '/onboarding' : '/(tabs)/dashboard');
      } else if (segments[0] === 'onboarding' && !isMissingData) {
        router.replace('/(tabs)/dashboard');
      } else if (inAuthGroup && segments[0] !== 'onboarding' && isMissingData) {
        router.replace('/onboarding');
      }
    }
  }, [user, isLoading, segments]);

  return (
    <>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="add-card" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="client/[id]" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppThemeProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AlertProvider>
              <RootLayoutNav />
            </AlertProvider>
          </ThemeProvider>
        </AppThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
