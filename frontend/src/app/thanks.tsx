import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/context/LanguageContext';

export default function ThanksScreen() {
  const router = useRouter();
  const { message, redirect } = useLocalSearchParams();
  const { t } = useLanguage();
  
  const displayMessage = message || t('thanks.defaultMessage');
  const redirectPath = redirect || '/login';

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(redirectPath as any);
    }, 5000);

    return () => clearTimeout(timer);
  }, [redirectPath, router]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Feather name="check-circle" size={80} color="#00C9FF" />
          </View>
          
          <ThemedText style={styles.title}>{t('thanks.title')}</ThemedText>
          <ThemedText style={styles.message}>{displayMessage}</ThemedText>
          
          <ThemedText style={styles.timerText}>{t('thanks.redirecting')}</ThemedText>
        </View>

        <Pressable 
          style={({ pressed }) => [
            styles.button,
            { opacity: pressed ? 0.8 : 1 }
          ]}
          onPress={() => router.replace(redirectPath as any)}
        >
          <ThemedText style={styles.buttonText}>{t('thanks.continue')}</ThemedText>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    marginBottom: 24,
    backgroundColor: '#ECFDF5',
    padding: 24,
    borderRadius: 64,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 26,
  },
  timerText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 32,
  },
  button: {
    backgroundColor: '#054687',
    paddingVertical: 18,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#054687',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
