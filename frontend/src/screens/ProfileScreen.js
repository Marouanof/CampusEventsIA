import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
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
    Alert.alert('Enregistré', 'Profil mis à jour');
    onBack();
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1c1c1e" />
        </TouchableOpacity>
        <Text style={styles.title}>Mon Profil</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Text style={styles.label}>Filière</Text>
        <TextInput
          style={styles.input}
          value={fieldOfStudy}
          onChangeText={setFieldOfStudy}
          placeholder="Ex: Informatique, Économie..."
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Année</Text>
        <View style={styles.yearRow}>
          {YEARS.map(y => (
            <TouchableOpacity
              key={y}
              style={[styles.yearBtn, year === y && styles.yearActive]}
              onPress={() => setYear(year === y ? '' : y)}
            >
              <Text style={[styles.yearText, year === y && styles.yearTextActive]}>{y}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Centres d'intérêt</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={interests}
          onChangeText={setInterests}
          placeholder="Ex: IA, robotique, développement web, sport..."
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={3}
        />
        <Text style={styles.hint}>
          Ces informations sont stockées localement et servent à améliorer les recommandations.
        </Text>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text style={styles.saveText}>Enregistrer</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ffffff', paddingBottom: 16, paddingHorizontal: 20,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1c1c1e' },
  body: { flex: 1 },
  bodyContent: { padding: 20, gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginTop: 8 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 15,
    borderWidth: 1, borderColor: '#e2e8f0', color: '#1e293b',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  yearRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  yearBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
  },
  yearActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  yearText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  yearTextActive: { color: '#fff' },
  hint: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#2563eb', borderRadius: 12,
    padding: 16, marginTop: 24,
  },
  saveText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
});
