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

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'onboarding' || segments[0] === 'add-card' || segments[0] === 'edit-profile';
    const isIndex = !segments[0] || segments[0] === 'index';
    const inPublicGroup = isIndex || segments[0] === 'login' || segments[0] === 'forgot-password';

    if (!user) {
      if (inAuthGroup) {
        router.replace('/login');
      }
    } else {
      const isMissingData = !user.first_name || !user.last_name || !user.birthday || !user.phone_number;
      
      if (inPublicGroup) {
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
