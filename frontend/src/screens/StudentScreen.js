import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getAllEvents } from '../database/events';
import { getRegistrations, registerForEvent, unregisterFromEvent, isEventFull, isEventPast } from '../database/registrations';
import { addFavorite, removeFavorite, getFavorites } from '../database/favorites';
import EventCard from '../components/EventCard';
import EventDetail from '../components/EventDetail';
import ChatScreen from './ChatScreen';
import ProfileScreen from './ProfileScreen';

const CATEGORIES = ['Talk', 'Workshop', 'Club', 'Exam', 'Other'];

export default function StudentScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [events, setEvents] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [periodFilter, setPeriodFilter] = useState('all');
  const [viewMode, setViewMode] = useState('events');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const loadData = useCallback(() => {
    setEvents(getAllEvents());
    setFavorites(getFavorites(user.id));
    setRegistrations(getRegistrations(user.id));
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const favoriteIds = useMemo(() => new Set(favorites.map((e) => e.id)), [favorites]);
  const registrationIds = useMemo(() => new Set(registrations.map((e) => e.id)), [registrations]);

  function toggleFavorite(eventId) {
    if (favoriteIds.has(eventId)) {
      removeFavorite(eventId, user.id);
    } else {
      addFavorite(eventId, user.id);
    }
    loadData();
  }

  function toggleRegistration(eventId) {
    if (registrationIds.has(eventId)) {
      unregisterFromEvent(eventId, user.id);
      loadData();
    } else {
      const ok = registerForEvent(eventId, user.id);
      if (!ok) {
        Alert.alert('Inscription impossible', "L'événement est passé ou complet");
      }
      loadData();
    }
  }

  function isRegDisabled(event) {
    if (registrationIds.has(event.id)) return { disabled: false };
    if (isEventPast(event.startDateTime)) return { disabled: true, reason: 'Passé' };
    if (isEventFull(event.id)) return { disabled: true, reason: 'Complet' };
    return { disabled: false };
  }

  const filteredEvents = useMemo(() => {
    let list = events;

    if (viewMode === 'assistant') return [];
    if (viewMode === 'favorites') {
      list = list.filter((e) => favoriteIds.has(e.id));
    } else if (viewMode === 'registrations') {
      list = registrations;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q));
    }

    if (selectedCategory) {
      list = list.filter((e) => e.category === selectedCategory);
    }

    if (periodFilter === 'upcoming') {
      list = list.filter((e) => new Date(e.startDateTime) >= new Date());
    } else if (periodFilter === 'past') {
      list = list.filter((e) => new Date(e.startDateTime) < new Date());
    }

    return list;
  }, [events, favorites, registrations, viewMode, searchQuery, selectedCategory, periodFilter, favoriteIds]);

  if (showProfile) {
    return <ProfileScreen user={user} onBack={() => setShowProfile(false)} />;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user.name}</Text>
          <Text style={styles.role}>Étudiant</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowProfile(true)} style={styles.profileBtn}>
            <Ionicons name="person-circle-outline" size={24} color="#1c1c1e" />
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={24} color="#1c1c1e" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabRow}>
        {[
          { key: 'events', label: 'Événements', icon: 'calendar' },
          { key: 'favorites', label: 'Favoris', icon: 'heart' },
          { key: 'registrations', label: 'Inscriptions', icon: 'checkmark-circle' },
          { key: 'assistant', label: 'IA', icon: 'sparkles' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, viewMode === tab.key && styles.tabActive]}
            onPress={() => setViewMode(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={14}
              color={viewMode === tab.key ? '#fff' : '#64748b'}
            />
            <Text style={[styles.tabText, viewMode === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {viewMode === 'assistant' ? (
        <ChatScreen embedded onBack={() => setViewMode('events')} user={user} />
      ) : (
        <>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color="#94a3b8" style={{ marginLeft: 12 }} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher par titre..."
          placeholderTextColor="#94a3b8"
          autoCapitalize="none"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={{ paddingRight: 12 }}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.chipRow}>
        <TouchableOpacity
          style={[styles.chip, !selectedCategory && styles.chipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>Toutes</Text>
        </TouchableOpacity>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, selectedCategory === cat && styles.chipActive]}
            onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
          >
            <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.periodRow}>
        {[
          { key: 'all', label: 'Toutes les dates' },
          { key: 'upcoming', label: 'À venir' },
          { key: 'past', label: 'Passés' },
        ].map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.periodBtn, periodFilter === opt.key && styles.periodActive]}
            onPress={() => setPeriodFilter(opt.key)}
          >
            <Text style={[styles.periodText, periodFilter === opt.key && styles.periodTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const reg = registrationIds.has(item.id);
          const { disabled, reason } = isRegDisabled(item);
          return (
            <EventCard
              event={item}
              onPress={() => setSelectedEvent(item)}
              studentActions={
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => toggleFavorite(item.id)} style={styles.actionBtn}>
                    <Ionicons
                      name={favoriteIds.has(item.id) ? 'heart' : 'heart-outline'}
                      size={20}
                      color={favoriteIds.has(item.id) ? '#e11d48' : '#94a3b8'}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => toggleRegistration(item.id)}
                    style={styles.actionBtn}
                    disabled={disabled && !reg}
                  >
                    <Ionicons
                      name={reg ? 'checkmark-circle' : disabled ? 'lock-closed' : 'add-circle-outline'}
                      size={20}
                      color={reg ? '#16a34a' : disabled ? '#cbd5e1' : '#94a3b8'}
                    />
                    <Text style={[styles.actionLabel, reg && { color: '#16a34a' }, disabled && !reg && { color: '#cbd5e1' }]}>
                      {reg ? 'Inscrit' : disabled ? reason : "S'inscrire"}
                    </Text>
                  </TouchableOpacity>
                </View>
              }
            />
          );
        }}
        contentContainerStyle={filteredEvents.length === 0 ? styles.empty : undefined}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchQuery ? 'Aucun résultat' : viewMode === 'favorites' ? 'Aucun favori' : viewMode === 'registrations' ? 'Aucune inscription' : viewMode === 'events' ? 'Aucun événement' : ''}
          </Text>
        }
      />

      </>
      )}

      <Modal visible={!!selectedEvent} animationType="slide">
        {selectedEvent ? (
          <EventDetail
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            isFav={favoriteIds.has(selectedEvent.id)}
            isReg={registrationIds.has(selectedEvent.id)}
            onToggleFav={() => toggleFavorite(selectedEvent.id)}
            onToggleReg={() => toggleRegistration(selectedEvent.id)}
            regDisabled={isRegDisabled(selectedEvent).disabled && !registrationIds.has(selectedEvent.id)}
            regDisabledReason={isRegDisabled(selectedEvent).reason}
          />
        ) : null}
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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileBtn: { padding: 4 },
  tabRow: {
    flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap',
    gap: 4, paddingHorizontal: 12, paddingTop: 10,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
  },
  tabActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  tabText: { fontSize: 12, color: '#64748b' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10,
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0',
  },
  searchInput: { flex: 1, padding: 12, fontSize: 15, color: '#1e293b' },
  chipRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingTop: 10,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 13, color: '#64748b' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  periodRow: {
    flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingVertical: 10,
  },
  periodBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12,
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
  },
  periodActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  periodText: { fontSize: 12, color: '#64748b' },
  periodTextActive: { color: '#fff', fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionLabel: { fontSize: 13, color: '#64748b' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#94a3b8' },
});
