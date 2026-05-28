import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
} from 'react-native';

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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Titre *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ex: Introduction à l'IA" />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textArea]} value={description}
        onChangeText={setDescription} placeholder="Description de l'événement..."
        multiline numberOfLines={3}
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Date début *</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="AAAA-MM-JJ" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Heure début *</Text>
          <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="HH:MM" />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Date fin</Text>
          <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} placeholder="AAAA-MM-JJ" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Heure fin</Text>
          <TextInput style={styles.input} value={endTime} onChangeText={setEndTime} placeholder="HH:MM" />
        </View>
      </View>

      <Text style={styles.label}>Lieu *</Text>
      <TextInput style={styles.input} value={locationName} onChangeText={setLocationName} placeholder="Ex: Amphi A" />

      <Text style={styles.label}>Organisateur</Text>
      <TextInput style={styles.input} value={organizerName} onChangeText={setOrganizerName} placeholder="Ex: Professeur Martin" />

      <View style={styles.row}>
        <View style={styles.half}>
          <Text style={styles.label}>Capacité max</Text>
          <TextInput style={styles.input} value={capacity} onChangeText={setCapacity} placeholder="Ex: 100" keyboardType="numeric" />
        </View>
        <View style={styles.half}>
          <Text style={styles.label}>Tags</Text>
          <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="Ex: IA, conférence" />
        </View>
      </View>

      <Text style={styles.label}>Catégorie</Text>
      <View style={styles.categories}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryBtn, category === cat && styles.categoryActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>{event ? 'Modifier' : 'Créer'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7', padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14, fontSize: 15,
    borderWidth: 1, borderColor: '#e2e8f0', color: '#1e293b',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  categoryBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
  },
  categoryActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  categoryText: { fontSize: 13, color: '#64748b' },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 24 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#f1f5f9' },
  cancelText: { fontSize: 16, color: '#64748b', fontWeight: '600' },
  submitBtn: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#2563eb' },
  submitText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
});
