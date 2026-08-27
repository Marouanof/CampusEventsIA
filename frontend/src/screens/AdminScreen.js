import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../context/AuthContext';
import { getAllEvents, createEvent, updateEvent, deleteEvent } from '../database/events';
import { getRegistrationCount } from '../database/users';
import EventCard from '../components/EventCard';
import EventForm from '../components/EventForm';
import ParticipantsScreen from './ParticipantsScreen';

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [events, setEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [regCounts, setRegCounts] = useState({});

  const loadEvents = useCallback(() => {
    const data = getAllEvents();
    setEvents(data);
    const counts = {};
    for (const e of data) {
      counts[e.id] = getRegistrationCount(e.id);
    }
    setRegCounts(counts);
  }, []);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  function openCreate() { setEditingEvent(null); setModalVisible(true); }
  function openEdit(event) { setEditingEvent(event); setModalVisible(true); }
  function openParticipants(event) { setSelectedEvent(event); }

  function handleSubmit(eventData) {
    try {
      if (editingEvent) updateEvent(editingEvent.id, eventData);
      else createEvent(eventData);
      setModalVisible(false);
      loadEvents();
    } catch (err) {
      Alert.alert('Erreur', err.message);
    }
  }

  function handleDelete(id) {
    Alert.alert('Confirmer', 'Supprimer cet événement ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: () => { try { deleteEvent(id); loadEvents(); } catch (err) { Alert.alert('Erreur', err.message); } },
      },
    ]);
  }

  async function handleExport() {
    try {
      const data = getAllEvents();
      const exportData = data.map(({ title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, tags, createdAt }) => ({
        title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, tags, createdAt,
      }));
      const fileUri = FileSystem.cacheDirectory + 'catalogue.json';
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2), { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { dialogTitle: 'Export du catalogue', mimeType: 'application/json', UTI: 'public.json' });
    } catch {
      Alert.alert('Erreur', "Impossible d'exporter le catalogue");
    }
  }

  if (selectedEvent) {
    return (
      <ParticipantsScreen
        eventId={selectedEvent.id}
        onBack={() => setSelectedEvent(null)}
      />
    );
  }

  const initials = (user.name || 'A').slice(0, 2).toUpperCase();
  const upcoming = events.filter((e) => new Date(e.startDateTime) >= new Date());
  const totalRegs = Object.values(regCounts).reduce((a, b) => a + b, 0);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Bonjour, {user.name}</Text>
            <Text style={styles.role}>Administrateur</Text>
          </View>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.iconBtn}>
          <Ionicons name="log-out-outline" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={18} color="#0040a0" />
          <Text style={styles.statNumber}>{events.length}</Text>
          <Text style={styles.statLabel}>Événements</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={18} color="#059669" />
          <Text style={[styles.statNumber, { color: '#059669' }]}>{totalRegs}</Text>
          <Text style={styles.statLabel}>Inscriptions</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="trending-up-outline" size={18} color="#d97706" />
          <Text style={[styles.statNumber, { color: '#d97706' }]}>{upcoming.length}</Text>
          <Text style={styles.statLabel}>À venir</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Événements</Text>
        <View style={styles.sectionActions}>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport} activeOpacity={0.7}>
            <Ionicons name="download-outline" size={17} color="#0040a0" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate} activeOpacity={0.8}>
            <Ionicons name="add" size={17} color="#fff" />
            <Text style={styles.addText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const count = regCounts[item.id] || 0;
          const isFull = item.capacity && count >= item.capacity;
          return (
            <View style={styles.eventRow}>
              <View style={styles.eventCardWrap}>
                <EventCard event={item} admin onPress={openEdit} onDelete={handleDelete} />
              </View>
              <TouchableOpacity
                style={[styles.participantsBtn, isFull && styles.participantsBtnFull]}
                onPress={() => openParticipants(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="people-outline" size={15} color={isFull ? '#dc2626' : '#0040a0'} />
                <Text style={[styles.participantsBtnText, isFull && { color: '#dc2626' }]}>
                  {count}/{item.capacity || '∞'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
        contentContainerStyle={events.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>Aucun événement</Text>
          </View>
        }
      />

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.root}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 8 }]}>
            <Text style={styles.modalTitle}>
              {editingEvent ? "Modifier l'événement" : 'Nouvel événement'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#0f172a" />
            </TouchableOpacity>
          </View>
          <EventForm
            event={editingEvent}
            onSubmit={handleSubmit}
            onCancel={() => setModalVisible(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', paddingBottom: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#0040a0', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  greeting: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  role: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  iconBtn: { padding: 8, borderRadius: 8 },

  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14 },
  statCard: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 14, padding: 12, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#0f172a' },
  statLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#0040a0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  addText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  exportBtn: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: '#f0f7ff',
    justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#dbeafe',
  },

  eventRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 16 },
  eventCardWrap: { flex: 1 },
  participantsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f0f7ff', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: '#dbeafe', marginLeft: 4,
  },
  participantsBtnFull: { backgroundColor: '#fef2f2', borderColor: '#fecdd3' },
  participantsBtnText: { fontSize: 12, fontWeight: '600', color: '#0040a0' },

  list: { paddingBottom: 16 },
  empty: { flex: 1 },
  emptyIcon: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af', fontWeight: '500' },

  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', paddingBottom: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  closeBtn: { padding: 6, borderRadius: 8 },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#0f172a' },
});
