import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/themed-text';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function ProfileScreen() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const userObj = JSON.parse(userStr);
          if (userObj.email) {
            setUserEmail(userObj.email);
          }
        }
      } catch (err) {
        console.error('Failed to load user', err);
      }
    };
    loadUser();
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await AsyncStorage.removeItem('user');
    } catch (e) {
      console.error(e);
    }
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.avatarContainer}>
          <Feather name="user" size={40} color="#054687" />
        </View>
        <ThemedText style={styles.title}>Profile</ThemedText>
        
        {userEmail ? (
          <ThemedText style={styles.emailText}>{userEmail}</ThemedText>
        ) : null}
        
        <View style={styles.spacer} />
        
        <Pressable 
          style={({ pressed }) => [
            styles.logoutButton,
            { opacity: pressed ? 0.8 : 1 }
          ]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color="#EF4444" style={styles.logoutIcon} />
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </Pressable>
      </View>

      <ConfirmDialog
        visible={showLogoutConfirm}
        title="Logout"
        message="Are you sure you want to log out?"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
        confirmText="Logout"
        cancelText="Cancel"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flex: 1, alignItems: 'center', padding: 24, paddingTop: 40 },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#111827' },
  emailText: { fontSize: 16, color: '#6B7280', marginBottom: 40 },
  spacer: { flex: 1 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2', // Light red background
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FECACA',
    width: '100%',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#EF4444', // Red text
    fontWeight: 'bold',
    fontSize: 16,
  }
});
