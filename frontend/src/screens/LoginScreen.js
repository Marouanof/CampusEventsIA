import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  const [error, setError] = useState('');

  function handleLogin() {
    setError('');
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    setLoading(true);
    const account = ACCOUNTS[email.trim().toLowerCase()];
    if (!account || account.password !== password) {
      setError('Email ou mot de passe incorrect');
      setLoading(false);
      return;
    }
    signIn({
      id: account.id,
      email: email.trim().toLowerCase(),
      name: account.name,
      role: account.role,
    });
  }

  function fillAccount(key) {
    setEmail(key);
    setPassword(ACCOUNTS[key].password);
    setError('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} />
        <Text style={styles.appName}>CampusEventsIA</Text>
        <Text style={styles.appDesc}>Trouve, inscris-toi et gère tes événements de campus</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bienvenue</Text>
        <Text style={styles.cardSubtitle}>Connecte-toi à ton compte</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Adresse email</Text>
          <TextInput
            style={styles.input}
            placeholder="ex: etudiant@campus.ma"
            placeholderTextColor="#a1a1aa"
            value={email}
            onChangeText={(t) => { setEmail(t); setError(''); }}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#a1a1aa"
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            secureTextEntry
            textContentType="password"
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
        </TouchableOpacity>

        <View style={styles.demoSection}>
          <Text style={styles.demoLabel}>Comptes de démonstration</Text>
          <View style={styles.demoRow}>
            <TouchableOpacity style={styles.demoBtn} onPress={() => fillAccount('admin@campus.ma')} activeOpacity={0.7}>
              <Ionicons name="shield-checkmark" size={16} color="#0040a0" />
              <Text style={styles.demoBtnText}>Admin</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.demoBtn} onPress={() => fillAccount('etudiant@campus.ma')} activeOpacity={0.7}>
              <Ionicons name="school" size={16} color="#0040a0" />
              <Text style={styles.demoBtnText}>Étudiant</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>CampusEventsIA · Agenda universitaire intelligent</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 28,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 14,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  appDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: -10,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    flex: 1,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#111827',
  },
  btn: {
    backgroundColor: '#0040a0',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  demoSection: {
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  demoLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '500',
  },
  demoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#f0f7ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  demoBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0040a0',
  },
  footer: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
