import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { categoryConfig } from '../utils';

const CATEGORIES = ['Talk', 'Workshop', 'Club', 'Exam', 'Other'];

function splitISO(iso) {
  if (!iso) return { date: '', time: '' };
  const parts = iso.split('T');
  return { date: parts[0] || '', time: (parts[1] || '').substring(0, 5) };
}

function toISO(date, time) {
  const pad = (n) => String(n).padStart(2, '0');
  const [h, m] = (time || '00:00').split(':').map(Number);
  return `${date}T${pad(h || 0)}:${pad(m || 0)}:00.000Z`;
}

function parseUTCDate(date, time) {
  const [y, M, d] = date.split('-').map(Number);
  const [h, m] = (time || '00:00').split(':').map(Number);
  return Date.UTC(y, M - 1, d, h || 0, m || 0);
}

export default function EventForm({ event, onSubmit, onCancel }) {
  const initial = splitISO(event?.startDateTime);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [locationName, setLocationName] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [category, setCategory] = useState('Other');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setDate(initial.date);
      setTime(initial.time);
      const end = splitISO(event.endDateTime);
      setEndDate(end.date);
      setEndTime(end.time);
      setLocationName(event.locationName || '');
      setOrganizerName(event.organizerName || '');
      setCapacity(event.capacity ? String(event.capacity) : '');
      setCategory(event.category || 'Other');
      setTags(Array.isArray(event.tags) ? event.tags.join(', ') : (event.tags || ''));
    }
  }, [event]);

  function handleSubmit() {
    const trimmed = {
      title: title.trim(),
      description: description.trim(),
      date: date.trim(),
      time: time.trim(),
      locationName: locationName.trim(),
    };

    if (!trimmed.title || !trimmed.description || !trimmed.date || !trimmed.time || !trimmed.locationName) {
      Alert.alert('Erreur', 'Tous les champs obligatoires (*) doivent être remplis');
      return;
    }

    const startDateTime = toISO(trimmed.date, trimmed.time);
    const startTs = parseUTCDate(trimmed.date, trimmed.time);
    if (isNaN(startTs)) { Alert.alert('Erreur', 'Date ou heure de début invalide'); return; }

    if (endDate.trim()) {
      const endTs = endTime.trim()
        ? parseUTCDate(endDate.trim(), endTime.trim())
        : parseUTCDate(endDate.trim(), '23:59');
      if (isNaN(endTs)) { Alert.alert('Erreur', 'Date ou heure de fin invalide'); return; }
      if (endTs < startTs) {
        Alert.alert('Erreur', 'La fin doit être après le début (date et heure)');
        return;
      }
    }

    const cap = capacity.trim();
    const capacityNum = cap ? parseInt(cap, 10) : null;
    if (cap && (!Number.isInteger(capacityNum) || capacityNum <= 0)) {
      Alert.alert('Erreur', 'La capacité doit être un entier positif');
      return;
    }

    const cat = CATEGORIES.includes(category) ? category : 'Other';

    onSubmit({
      title: trimmed.title,
      description: trimmed.description,
      category: cat,
      startDateTime,
      endDateTime: endDate.trim()
        ? (endTime.trim() ? toISO(endDate.trim(), endTime.trim()) : `${endDate.trim()}T23:59:00.000Z`)
        : null,
      locationName: trimmed.locationName,
      organizerName: organizerName.trim() || '',
      capacity: capacityNum,
      tags: tags.trim()
        ? tags.split(',').map(t => t.trim()).filter(Boolean)
        : null,
      imageUrl: null,
    });
  }

  const cat = categoryConfig[category] || categoryConfig.Other;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Field label="Titre" required>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ex: Introduction à l'IA" placeholderTextColor="#9ca3af" />
      </Field>

      <Field label="Description" required>
        <TextInput
          style={[styles.input, styles.textArea]} value={description}
          onChangeText={setDescription} placeholder="Description de l'événement..."
          placeholderTextColor="#9ca3af" multiline numberOfLines={3}
        />
      </Field>

      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="Date début" required>
            <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="AAAA-MM-JJ" placeholderTextColor="#9ca3af" />
          </Field>
        </View>
        <View style={styles.half}>
          <Field label="Heure début" required>
            <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="HH:MM" placeholderTextColor="#9ca3af" />
          </Field>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="Date fin">
            <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="AAAA-MM-JJ" placeholderTextColor="#9ca3af" />
          </Field>
        </View>
        <View style={styles.half}>
          <Field label="Heure fin">
            <TextInput style={styles.input} value={endTime} onChangeText={setEndTime} placeholder="HH:MM" placeholderTextColor="#9ca3af" />
          </Field>
        </View>
      </View>

      <Field label="Lieu" required>
        <TextInput style={styles.input} value={locationName} onChangeText={setLocationName} placeholder="Ex: Amphi A" placeholderTextColor="#9ca3af" />
      </Field>

      <Field label="Organisateur">
        <TextInput style={styles.input} value={organizerName} onChangeText={setOrganizerName} placeholder="Ex: Professeur Martin" placeholderTextColor="#9ca3af" />
      </Field>

      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="Capacité max">
            <TextInput style={styles.input} value={capacity} onChangeText={setCapacity} placeholder="Ex: 100" keyboardType="numeric" placeholderTextColor="#9ca3af" />
          </Field>
        </View>
        <View style={styles.half}>
          <Field label="Tags">
            <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="Ex: IA, conférence" placeholderTextColor="#9ca3af" />
          </Field>
        </View>
      </View>

      <Field label="Catégorie">
        <View style={styles.categories}>
          {CATEGORIES.map((c) => {
            const cc = categoryConfig[c];
            const active = category === c;
            return (
              <TouchableOpacity
                key={c}
                style={[styles.categoryBtn, active && { backgroundColor: cc.bg, borderColor: cc.color }]}
                onPress={() => setCategory(c)}
                activeOpacity={0.7}
              >
                <Ionicons name={cc.icon} size={14} color={active ? cc.color : '#9ca3af'} />
                <Text style={[styles.categoryText, active && { color: cc.color, fontWeight: '600' }]}>{c}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Field>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
          <Ionicons name={event ? 'checkmark' : 'add'} size={17} color="#fff" />
          <Text style={styles.submitText}>{event ? 'Modifier' : 'Créer'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Field({ label, required, children }) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>
        {label}
        {required ? <Text style={fieldStyles.required}> *</Text> : null}
      </Text>
      {children}
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 5, marginTop: 10 },
  required: { color: '#dc2626' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  content: { padding: 16, paddingBottom: 32 },
  input: {
    backgroundColor: '#ffffff', borderRadius: 10, padding: 12, fontSize: 14,
    borderWidth: 1, borderColor: '#e5e7eb', color: '#0f172a',
  },
  textArea: { minHeight: 76, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: 10,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb',
  },
  categoryText: { fontSize: 13, color: '#6b7280' },
  buttons: { flexDirection: 'row', gap: 10, marginTop: 24 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb',
  },
  cancelText: { fontSize: 15, color: '#6b7280', fontWeight: '600' },
  submitBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    padding: 14, borderRadius: 12, backgroundColor: '#0040a0',
  },
  submitText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
