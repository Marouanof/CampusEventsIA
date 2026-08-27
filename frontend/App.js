import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/database/init';
import { seedIfEmpty } from './src/database/seed';
import { seedUsers, seedRegistrations } from './src/database/users';
import { requestNotificationPermission } from './src/services/notifications';

export default function App() {
  useEffect(() => {
    initDatabase();
    seedIfEmpty();
    seedUsers();
    seedRegistrations();
    requestNotificationPermission();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
