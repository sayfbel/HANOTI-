import { useRouter, Link } from 'expo-router';
import { useState, useEffect } from 'react';
import { StyleSheet, TextInput, Pressable, View, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Checkbox from 'expo-checkbox';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { Feather, AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@/context/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/context/LanguageContext';
// back to the main window and then close itself.
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();
  const { signIn, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/(tabs)/dashboard');
    }
  }, [user, isLoading]);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: '977526709418-on4okqart5m6b8089cn0umrbee00ivck.apps.googleusercontent.com',
    clientId: '977526709418-on4okqart5m6b8089cn0umrbee00ivck.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      console.log('Google Auth Response:', response);
      // Modern expo-auth-session provides it in authentication.idToken
      // Older versions / fallback use params.id_token
      const idToken = response.authentication?.idToken || response.params?.id_token || response.authentication?.accessToken;
      
      if (idToken) {
        handleGoogleLogin(idToken);
      } else {
        setErrorMsg('Google login succeeded, but no ID Token was received.');
      }
    }
  }, [response]);

  const handleGoogleLogin = async (idToken: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('http://localhost:3000/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json();
      
      if (res.ok) {
        if (data.user && data.token) {
          await signIn(data.user, data.token, rememberMe);
          router.replace('/(tabs)/dashboard');
        }
      } else {
        setErrorMsg(data.message || 'Error connecting to server.');
      }
    } catch (error) {
      setErrorMsg('Could not reach the server. Make sure your backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg(t('login.err.emptyFields'));
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (data.user && data.token) {
          await signIn(data.user, data.token, rememberMe);
          router.replace('/(tabs)/dashboard');
        }
      } else {
        setErrorMsg(data.message || t('login.err.network'));
      }
    } catch (error) {
      setErrorMsg(t('login.err.network'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>{t('login.welcomeBack')}</ThemedText>
          <ThemedText style={styles.subtitle}>{t('login.signInSubtitle')}</ThemedText>
        </View>

        <View style={styles.formContainer}>
          {errorMsg ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={20} color="#EF4444" />
              <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <TextInput 
              style={styles.input}
              placeholder={t('login.emailPlaceholder')}
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          
          <View style={[styles.inputGroup, styles.passwordGroup]}>
            <TextInput 
              style={[styles.input, styles.passwordInput]}
              placeholder={t('login.passwordPlaceholder')}
              placeholderTextColor="#9CA3AF"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable 
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* Remember Me and Forgot Password Row */}
          <View style={styles.optionsRow}>
            <View style={styles.rememberMeContainer}>
              <Checkbox
                value={rememberMe}
                onValueChange={setRememberMe}
                color={rememberMe ? '#054687' : undefined}
                style={styles.checkbox}
              />
              <ThemedText style={styles.rememberText}>{t('login.rememberMe')}</ThemedText>
            </View>
            <Link href="/forgot-password" asChild>
              <Pressable>
                <ThemedText style={styles.forgotText}>{t('login.forgotPassword')}</ThemedText>
              </Pressable>
            </Link>
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.loginButton,
              { opacity: pressed || loading ? 0.8 : 1 }
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <ThemedText style={styles.loginButtonText}>{t('login.connexion')}</ThemedText>
            )}
          </Pressable>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>{t('login.or')}</ThemedText>
            <View style={styles.dividerLine} />
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.googleButton,
              { opacity: pressed || loading ? 0.8 : 1 }
            ]}
            onPress={() => promptAsync()}
            disabled={!request || loading}
          >
            <AntDesign name="google" size={20} color="#333" style={{ marginRight: 8 }} />
            <ThemedText style={styles.googleButtonText}>{t('login.continueWithGoogle')}</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  safeArea: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40, gap: 8 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 16, color: '#6B7280' },
  formContainer: { gap: 16 },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    flex: 1,
  },
  inputGroup: {},
  passwordGroup: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 18,
    fontSize: 16,
    color: '#111827',
  },
  passwordInput: {
    paddingRight: 60, // make room for eye icon
  },
  eyeIcon: {
    position: 'absolute',
    right: 20,
    padding: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginTop: -4,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  rememberText: {
    color: '#4B5563',
    fontSize: 14,
  },
  forgotText: {
    color: '#054687',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#054687',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#054687',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9CA3AF',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 16,
  },
});
