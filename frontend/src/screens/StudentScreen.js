import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getAllEvents } from '../database/events';
import { getRegistrations, registerForEvent, unregisterFromEvent, isEventFull, isEventPast, updateRegistrationNotificationId, getRegistrationNotificationId } from '../database/registrations';
import { addFavorite, removeFavorite, getFavorites } from '../database/favorites';
import { scheduleEventReminder, cancelEventReminder } from '../services/notifications';
import EventCard from '../components/EventCard';
import EventDetail from '../components/EventDetail';
import CalendarView from '../components/CalendarView';
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

  useEffect(() => { loadData(); }, [loadData]);

  const favoriteIds = useMemo(() => new Set(favorites.map((e) => e.id)), [favorites]);
  const registrationIds = useMemo(() => new Set(registrations.map((e) => e.id)), [registrations]);

  function toggleFavorite(eventId) {
    if (favoriteIds.has(eventId)) removeFavorite(eventId, user.id);
    else addFavorite(eventId, user.id);
    loadData();
  }

  async function toggleRegistration(eventId) {
    if (registrationIds.has(eventId)) {
      const notifId = getRegistrationNotificationId(eventId, user.id);
      if (notifId) await cancelEventReminder(notifId);
      unregisterFromEvent(eventId, user.id);
      loadData();
    } else {
      const ok = registerForEvent(eventId, user.id);
      if (!ok) {
        Alert.alert('Inscription impossible', "L'événement est passé ou complet");
        return;
      }
      const event = events.find(e => e.id === eventId);
      if (event) {
        const notifId = await scheduleEventReminder(event);
        if (notifId) updateRegistrationNotificationId(eventId, user.id, notifId);
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
    if (viewMode === 'favorites') list = list.filter((e) => favoriteIds.has(e.id));
    else if (viewMode === 'registrations') list = registrations;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.locationName && e.locationName.toLowerCase().includes(q)) ||
        (Array.isArray(e.tags) && e.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }
    if (selectedCategory) list = list.filter((e) => e.category === selectedCategory);
    if (periodFilter === 'upcoming') list = list.filter((e) => new Date(e.startDateTime) >= new Date());
    else if (periodFilter === 'past') list = list.filter((e) => new Date(e.startDateTime) < new Date());
    return list;
  }, [events, favorites, registrations, viewMode, searchQuery, selectedCategory, periodFilter, favoriteIds]);

  if (showProfile) return <ProfileScreen user={user} onBack={() => setShowProfile(false)} />;

  const initials = (user.name || 'U').slice(0, 2).toUpperCase();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Bonjour, {user.name}</Text>
            <Text style={styles.role}>{user.role === 'admin' ? 'Administrateur' : 'Étudiant'}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowProfile(true)} style={styles.iconBtn}>
            <Ionicons name="person-outline" size={20} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity onPress={signOut} style={styles.iconBtn}>
            <Ionicons name="log-out-outline" size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {[
          { key: 'events', label: 'Événements', icon: 'calendar-outline' },
          { key: 'calendar', label: 'Calendrier', icon: 'today-outline' },
          { key: 'favorites', label: 'Favoris', icon: 'heart-outline' },
          { key: 'registrations', label: 'Inscriptions', icon: 'checkmark-circle-outline' },
          { key: 'assistant', label: 'IA', icon: 'sparkles-outline' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, viewMode === tab.key && styles.tabActive]}
            onPress={() => setViewMode(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon}
              size={15}
              color={viewMode === tab.key ? '#fff' : '#6b7280'}
            />
            <Text style={[styles.tabText, viewMode === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {viewMode === 'assistant' ? (
        <ChatScreen embedded onBack={() => setViewMode('events')} user={user} />
      ) : viewMode === 'calendar' ? (
        <CalendarView events={events} onEventPress={(ev) => setSelectedEvent(ev)} />
      ) : (
        <View style={styles.contentWrap}>
          <View style={styles.searchContainer}>
            <View style={styles.searchRow}>
              <Ionicons name="search" size={17} color="#9ca3af" />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Rechercher un événement..."
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={17} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, !selectedCategory && styles.chipActive]}
              onPress={() => setSelectedCategory(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>Toutes</Text>
            </TouchableOpacity>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, selectedCategory === cat && styles.chipActive]}
                onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.periodRow}>
            {[
              { key: 'all', label: 'Toutes' },
              { key: 'upcoming', label: 'À venir' },
              { key: 'past', label: 'Passés' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.periodBtn, periodFilter === opt.key && styles.periodActive]}
                onPress={() => setPeriodFilter(opt.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.periodText, periodFilter === opt.key && styles.periodTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => String(item.id)}
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
                          size={18}
                          color={favoriteIds.has(item.id) ? '#e11d48' : '#9ca3af'}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => toggleRegistration(item.id)}
                        style={[styles.regBtn, reg && styles.regBtnActive, disabled && !reg && styles.regBtnDisabled]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.regBtnText, reg && styles.regBtnTextActive, disabled && !reg && styles.regBtnTextDisabled]}>
                          {reg ? 'Inscrit ✓' : disabled ? reason : "S'inscrire"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
              );
            }}
            contentContainerStyle={filteredEvents.length === 0 ? styles.empty : styles.list}
            ListEmptyComponent={
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={40} color="#d1d5db" />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'Aucun résultat' : viewMode === 'favorites' ? 'Aucun favori' : viewMode === 'registrations' ? 'Aucune inscription' : 'Aucun événement'}
                </Text>
              </View>
            }
          />
        </View>
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
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8, borderRadius: 8 },

  tabScroll: { paddingTop: 12, paddingBottom: 4, flexGrow: 0 },
  tabRow: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb',
  },
  tabActive: { backgroundColor: '#0040a0', borderColor: '#0040a0' },
  tabText: { fontSize: 12, fontWeight: '500', color: '#6b7280' },
  tabTextActive: { color: '#ffffff', fontWeight: '600' },

  searchContainer: { paddingHorizontal: 16, paddingTop: 10 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb',
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: '#0f172a' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingTop: 10 },
  chip: {
    paddingHorizontal: 13, paddingVertical: 6, borderRadius: 10,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb',
  },
  chipActive: { backgroundColor: '#0040a0', borderColor: '#0040a0' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  chipTextActive: { color: '#ffffff' },

  periodRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingTop: 8 },
  periodBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8,
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb',
  },
  periodActive: { backgroundColor: '#f0f7ff', borderColor: '#0040a0' },
  periodText: { fontSize: 12, fontWeight: '500', color: '#6b7280' },
  periodTextActive: { color: '#0040a0' },

  list: { paddingTop: 8, paddingBottom: 16 },
  contentWrap: { flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  actionBtn: { padding: 4 },
  regBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#f0f7ff', borderWidth: 1, borderColor: '#dbeafe',
  },
  regBtnActive: { backgroundColor: '#0040a0', borderColor: '#0040a0' },
  regBtnDisabled: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  regBtnText: { fontSize: 12, fontWeight: '600', color: '#0040a0' },
  regBtnTextActive: { color: '#ffffff' },
  regBtnTextDisabled: { color: '#9ca3af' },

  empty: { flex: 1 },
  emptyIcon: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af', fontWeight: '500' },
});
