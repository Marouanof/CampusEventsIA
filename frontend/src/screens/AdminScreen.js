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
import EventCard from '../components/EventCard';
import EventForm from '../components/EventForm';

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [events, setEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const loadEvents = useCallback(() => {
    const data = getAllEvents();
    setEvents(data);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  function openCreate() {
    setEditingEvent(null);
    setModalVisible(true);
  }

  function openEdit(event) {
    setEditingEvent(event);
    setModalVisible(true);
  }

  function handleSubmit(eventData) {
    try {
      if (editingEvent) {
        updateEvent(editingEvent.id, eventData);
      } else {
        createEvent(eventData);
      }
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
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          try {
            deleteEvent(id);
            loadEvents();
          } catch (err) {
            Alert.alert('Erreur', err.message);
          }
        },
      },
    ]);
  }

  async function handleExport() {
    try {
      const events = getAllEvents();
      const exportData = events.map(({ id, title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, tags, createdAt }) => ({
        title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, registeredCount, tags, createdAt,
      }));
      const fileUri = FileSystem.cacheDirectory + 'catalogue.json';
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await Sharing.shareAsync(fileUri, {
        dialogTitle: 'Export du catalogue',
        mimeType: 'application/json',
        UTI: 'public.json',
      });
    } catch {
      Alert.alert('Erreur', 'Impossible d\'exporter le catalogue');
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user.name}</Text>
          <Text style={styles.role}>Administrateur</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color="#1c1c1e" />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Événements ({events.length})</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <Ionicons name="download-outline" size={18} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addText}>Ajouter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EventCard event={item} admin onPress={openEdit} onDelete={handleDelete} />
        )}
        contentContainerStyle={events.length === 0 ? styles.empty : undefined}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucun événement pour le moment</Text>
        }
      />

      <Modal visible={modalVisible} animationType="slide">
        <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.modalTitle}>
            {editingEvent ? "Modifier l'événement" : 'Nouvel événement'}
          </Text>
        </View>
        <EventForm
          event={editingEvent}
          onSubmit={handleSubmit}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', paddingBottom: 20, paddingHorizontal: 20,
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1c1c1e' },
  role: { fontSize: 14, color: '#8e8e93', marginTop: 2 },
  logoutBtn: { padding: 8 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563eb',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 4,
  },
  addText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exportBtn: {
    backgroundColor: '#e8e8ed', width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
  },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#94a3b8' },
  modalHeader: {
    backgroundColor: '#ffffff', paddingTop: 16, paddingBottom: 16, paddingHorizontal: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1c1c1e' },
});
