import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../context/AuthContext';

export default function AppLayout() {
  const { session, isLoading } = useAuth();

  if (!isLoading && !session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
