import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, Pressable, View, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/context/LanguageContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const requestResetCode = async () => {
    setErrorMsg('');
    if (!email) {
      setErrorMsg('Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) setStep(2);
      else setErrorMsg(data.message || 'Verification failed');
    } catch (e) {
      setErrorMsg('Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setErrorMsg('');
    if (!code || code.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit code.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (res.ok) setStep(3);
      else setErrorMsg(data.message || 'Invalid code');
    } catch (e) {
      setErrorMsg('Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setErrorMsg('');
    if (!newPassword || newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        router.replace({
          pathname: '/thanks',
          params: {
            message: t('forgot.successMessage'),
            redirect: '/login'
          }
        });
      } else {
        setErrorMsg(data.message || 'Reset failed');
      }
    } catch (e) {
      setErrorMsg('Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => {
            setErrorMsg('');
            if (step > 1) {
              setStep(step - 1);
            } else if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/login');
            }
          }}
        >
          <Feather name="arrow-left" size={24} color="#111827" />
        </Pressable>

        <View style={styles.header}>
          <ThemedText style={styles.title}>
            {step === 1 ? t('forgot.title1') : step === 2 ? t('forgot.title2') : t('forgot.title3')}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {step === 1 
              ? t('forgot.subtitle1') 
              : step === 2 
              ? t('forgot.subtitle2') 
              : t('forgot.subtitle3')}
          </ThemedText>
        </View>

        <View style={styles.formContainer}>
          {errorMsg ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={20} color="#EF4444" />
              <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
            </View>
          ) : null}

          {step === 1 && (
            <>
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
              <Pressable style={styles.actionButton} onPress={requestResetCode} disabled={loading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.actionButtonText}>{t('forgot.sendCode')}</ThemedText>}
              </Pressable>
            </>
          )}

          {step === 2 && (
            <>
              <View style={styles.inputGroup}>
                <TextInput 
                  style={styles.input}
                  placeholder={t('forgot.codePlaceholder')}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                />
              </View>
              <Pressable style={styles.actionButton} onPress={verifyCode} disabled={loading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.actionButtonText}>{t('forgot.verifyCode')}</ThemedText>}
              </Pressable>
            </>
          )}

          {step === 3 && (
            <>
              <View style={styles.inputGroup}>
                <TextInput 
                  style={styles.input}
                  placeholder={t('forgot.newPasswordPlaceholder')}
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>
              <View style={styles.inputGroup}>
                <TextInput 
                  style={styles.input}
                  placeholder={t('forgot.confirmPasswordPlaceholder')}
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
              <Pressable style={styles.actionButton} onPress={resetPassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.actionButtonText}>{t('forgot.resetPassword')}</ThemedText>}
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  safeArea: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  header: { marginBottom: 40, gap: 8 },
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
  actionButton: {
    backgroundColor: '#054687',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#054687',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
});
