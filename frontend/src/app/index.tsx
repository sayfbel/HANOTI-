import { useRouter } from 'expo-router';
import { StyleSheet, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';

import { ThemedText } from '@/components/themed-text';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/(tabs)/dashboard');
    }
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <ThemedText style={styles.logoText}>HANOT+</ThemedText>
              <ThemedText style={styles.sloganText}>
                {t('index.slogan')}
              </ThemedText>
            </View>
            
            <Pressable 
              style={({ pressed }) => [
                styles.button,
                { opacity: pressed ? 0.8 : 1 }
              ]}
              onPress={() => router.replace('/login')}
            >
              <ThemedText style={styles.buttonText}>{t('index.getStarted')}</ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#0B308D',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 32,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  sloganText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#0B308D',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
