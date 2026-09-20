import { StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { PageHeader } from '@/components/ui/PageHeader';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function AddScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <PageHeader 
        title="Add" 
        rightComponent={
          <Pressable onPress={() => router.push('/settings')} style={{ padding: 4 }}>
            <Feather name="settings" size={24} color={colors.text} />
          </Pressable>
        }
      />
      <View style={styles.container}>
        <ThemedText style={styles.title}>Add Content</ThemedText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 110 },
  title: { fontSize: 24, fontWeight: 'bold' }
});
