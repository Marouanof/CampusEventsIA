import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const ACCOUNTS = {
  'admin@campus.ma':    { password: 'admin123',    name: 'Admin',    role: 'admin',  id: 1 },
  'etudiant@campus.ma': { password: 'etudiant123', name: 'Étudiant', role: 'student', id: 2 },
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  function handleLogin() {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    const account = ACCOUNTS[email.trim().toLowerCase()];
    if (!account || account.password !== password) {
      Alert.alert('Erreur', 'Email ou mot de passe incorrect');
      setLoading(false);
      return;
    }
    const user = {
      id: account.id,
      email: email.trim().toLowerCase(),
      name: account.name,
      role: account.role,
    };
    signIn(user);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Image source={require('../../assets/icon.png')} style={styles.logoImage} />
        <Text style={styles.title}>CampusEventsIA</Text>
        <Text style={styles.subtitle}>Agenda Universitaire Intelligent</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor="#94a3b8"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  header: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoImage: { width: 80, height: 80, marginBottom: 12, borderRadius: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1c1c1e' },
  subtitle: { fontSize: 15, color: '#8e8e93', marginTop: 6 },
  form: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 16 },
  input: {
    backgroundColor: '#f1f5f9', borderRadius: 12, padding: 16, fontSize: 16,
    color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0',
  },
  button: { backgroundColor: '#2563eb', borderRadius: 12, padding: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
