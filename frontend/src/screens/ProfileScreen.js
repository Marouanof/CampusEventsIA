import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getProfile, saveProfile } from '../database/profile';

const YEARS = ['L1', 'L2', 'L3', 'M1', 'M2', 'Doctorat'];

export default function ProfileScreen({ user, onBack }) {
  const insets = useSafeAreaInsets();
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [year, setYear] = useState('');
  const [interests, setInterests] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getProfile(user.id);
    if (p) {
      setFieldOfStudy(p.fieldOfStudy || '');
      setYear(p.year || '');
      setInterests(p.interests || '');
    }
  }, [user.id]);

  function handleSave() {
    saveProfile(user.id, { fieldOfStudy: fieldOfStudy.trim(), year, interests: interests.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const initials = (user.name || 'U').slice(0, 2).toUpperCase();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons
              name={user.role === 'admin' ? 'shield-checkmark' : 'school'}
              size={13}
              color="#0040a0"
            />
            <Text style={styles.roleText}>{user.role === 'admin' ? 'Administrateur' : 'Étudiant'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations académiques</Text>

          <Text style={styles.label}>Filière</Text>
          <TextInput
            style={styles.input}
            value={fieldOfStudy}
            onChangeText={setFieldOfStudy}
            placeholder="Ex: Informatique, Économie..."
            placeholderTextColor="#a1a1aa"
          />

          <Text style={styles.label}>Année</Text>
          <View style={styles.yearRow}>
            {YEARS.map(y => (
              <TouchableOpacity
                key={y}
                style={[styles.yearBtn, year === y && styles.yearActive]}
                onPress={() => setYear(year === y ? '' : y)}
                activeOpacity={0.7}
              >
                <Text style={[styles.yearText, year === y && styles.yearTextActive]}>{y}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préférences</Text>

          <Text style={styles.label}>Centres d'intérêt</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={interests}
            onChangeText={setInterests}
            placeholder="Ex: IA, robotique, web, sport..."
            placeholderTextColor="#a1a1aa"
            multiline
            numberOfLines={3}
          />
          <View style={styles.hintRow}>
            <Ionicons name="information-circle-outline" size={14} color="#9ca3af" />
            <Text style={styles.hint}>Utilisés pour personnaliser les recommandations IA</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saved && styles.saveBtnOk]}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Ionicons name={saved ? 'checkmark-circle' : 'checkmark'} size={20} color="#fff" />
          <Text style={styles.saveText}>{saved ? 'Enregistré !' : 'Enregistrer'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ffffff', paddingBottom: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: { padding: 6, borderRadius: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#0f172a' },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 14 },

  profileCard: {
    backgroundColor: '#ffffff', borderRadius: 16, alignItems: 'center',
    paddingVertical: 24, paddingHorizontal: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#0040a0', justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 22, fontWeight: '700', color: '#ffffff' },
  userName: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  userEmail: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: 20, backgroundColor: '#f0f7ff', borderWidth: 1, borderColor: '#dbeafe',
  },
  roleText: { fontSize: 12, fontWeight: '600', color: '#0040a0' },

  section: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 18, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', color: '#9ca3af',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 4 },
  input: {
    backgroundColor: '#f9fafb', borderRadius: 10, padding: 13, fontSize: 15,
    borderWidth: 1, borderColor: '#e5e7eb', color: '#111827',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  yearRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  yearBtn: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10,
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
  },
  yearActive: { backgroundColor: '#0040a0', borderColor: '#0040a0' },
  yearText: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  yearTextActive: { color: '#ffffff' },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  hint: { fontSize: 12, color: '#9ca3af' },

  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#0040a0', borderRadius: 12,
    paddingVertical: 15, marginTop: 4,
  },
  saveBtnOk: { backgroundColor: '#16a34a' },
  saveText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
});
