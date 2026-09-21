import AppTabs from '@/components/app-tabs';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0B308D" />
      </View>
    );
  }
  
  if (!user) {
    return <Redirect href="/login" />;
  }

  return <AppTabs />;
}
