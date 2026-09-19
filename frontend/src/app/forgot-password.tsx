import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, Pressable, View, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const requestResetCode = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email.');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) setStep(2);
      else Alert.alert('Error', data.message || 'Verification failed');
    } catch (e) {
      Alert.alert('Error', 'Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code || code.length !== 6) return Alert.alert('Error', 'Please enter a valid 6-digit code.');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (res.ok) setStep(3);
      else Alert.alert('Error', data.message || 'Invalid code');
    } catch (e) {
      Alert.alert('Error', 'Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match.');
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
        Alert.alert('Success', 'Password updated successfully!', [
          { text: 'OK', onPress: () => router.replace('/login') }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Reset failed');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not reach server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#111827" />
        </Pressable>

        <View style={styles.header}>
          <ThemedText style={styles.title}>
            {step === 1 ? 'Forgot Password' : step === 2 ? 'Enter Code' : 'New Password'}
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            {step === 1 
              ? 'Enter your email to receive a reset code' 
              : step === 2 
              ? 'Enter the 6-digit code sent to your email' 
              : 'Create a strong, new password'}
          </ThemedText>
        </View>

        <View style={styles.formContainer}>
          {step === 1 && (
            <>
              <View style={styles.inputGroup}>
                <TextInput 
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <Pressable style={styles.actionButton} onPress={requestResetCode} disabled={loading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.actionButtonText}>Send Code</ThemedText>}
              </Pressable>
            </>
          )}

          {step === 2 && (
            <>
              <View style={styles.inputGroup}>
                <TextInput 
                  style={styles.input}
                  placeholder="6-Digit Code"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={setCode}
                />
              </View>
              <Pressable style={styles.actionButton} onPress={verifyCode} disabled={loading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.actionButtonText}>Verify Code</ThemedText>}
              </Pressable>
            </>
          )}

          {step === 3 && (
            <>
              <View style={styles.inputGroup}>
                <TextInput 
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </View>
              <View style={styles.inputGroup}>
                <TextInput 
                  style={styles.input}
                  placeholder="Confirm New Password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
              <Pressable style={styles.actionButton} onPress={resetPassword} disabled={loading}>
                {loading ? <ActivityIndicator color="#ffffff" /> : <ThemedText style={styles.actionButtonText}>Update Password</ThemedText>}
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
