// Powered by OnSpace.AI
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export default function IndexScreen() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      if (currentUser) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [isLoading, currentUser]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
