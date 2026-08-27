import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getRegistrationsByEvent } from '../database/users';
import { getEventById } from '../database/events';
import { formatDate, formatTime } from '../utils';

export default function ParticipantsScreen({ eventId, onBack }) {
  const insets = useSafeAreaInsets();
  const [participants, setParticipants] = useState([]);
  const [event, setEvent] = useState(null);

  useEffect(() => {
    const ev = getEventById(eventId);
    setEvent(ev);
    setParticipants(getRegistrationsByEvent(eventId));
  }, [eventId]);

  if (!event) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color="#0040a0" />
      </View>
    );
  }

  const capacity = event.capacity || '∞';
  const filled = participants.length;
  const ratio = event.capacity ? Math.round((filled / event.capacity) * 100) : null;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{event.title}</Text>
          <Text style={styles.headerSub}>{filled} inscrit{filled !== 1 ? 's' : ''} · {capacity} place{capacity !== 1 ? 's' : ''}</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {ratio !== null && (
        <View style={styles.capacityBar}>
          <View style={styles.capacityInfo}>
            <Text style={styles.capacityLabel}>Remplissage</Text>
            <Text style={[styles.capacityPercent, ratio >= 90 && { color: '#dc2626' }, ratio >= 70 && ratio < 90 && { color: '#d97706' }]}>{ratio}%</Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${ratio}%` }, ratio >= 90 && { backgroundColor: '#dc2626' }, ratio >= 70 && ratio < 90 && { backgroundColor: '#d97706' }]} />
          </View>
        </View>
      )}

      <View style={styles.infoRow}>
        <View style={styles.infoChip}>
          <Ionicons name="location-outline" size={14} color="#6b7280" />
          <Text style={styles.infoChipText}>{event.locationName}</Text>
        </View>
        <View style={styles.infoChip}>
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text style={styles.infoChipText}>{formatDate(event.startDateTime)} · {formatTime(event.startDateTime)}</Text>
        </View>
      </View>

      <FlatList
        data={participants}
        keyExtractor={(item) => item.registrationId}
        renderItem={({ item }) => {
          const initials = (item.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
          return (
            <View style={styles.participantCard}>
              <View style={[styles.avatar, { backgroundColor: item.avatarColor || '#6b7280' }]}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.participantInfo}>
                <Text style={styles.participantName}>{item.name}</Text>
                <Text style={styles.participantEmail}>{item.email}</Text>
              </View>
              <View style={styles.participantMeta}>
                <Text style={styles.participantDate}>{formatDate(item.registeredAt)}</Text>
                <View style={styles.statusDot} />
              </View>
            </View>
          );
        }}
        contentContainerStyle={participants.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={
          <View style={styles.emptyIcon}>
            <Ionicons name="people-outline" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>Aucun inscrit pour le moment</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f2f5' },
  loadingRoot: { flex: 1, backgroundColor: '#f0f2f5', justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ffffff', paddingBottom: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: { padding: 6, borderRadius: 8 },
  headerCenter: { flex: 1, alignItems: 'center', marginHorizontal: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#0f172a' },
  headerSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },

  capacityBar: { backgroundColor: '#ffffff', marginHorizontal: 16, marginTop: 14, borderRadius: 14, padding: 14 },
  capacityInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  capacityLabel: { fontSize: 13, fontWeight: '500', color: '#6b7280' },
  capacityPercent: { fontSize: 13, fontWeight: '700', color: '#059669' },
  barBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#0040a0', borderRadius: 4 },

  infoRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  infoChipText: { fontSize: 12, color: '#6b7280', fontWeight: '500' },

  list: { padding: 16, gap: 8 },
  participantCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff',
    borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  participantInfo: { flex: 1 },
  participantName: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  participantEmail: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  participantMeta: { alignItems: 'flex-end', gap: 4 },
  participantDate: { fontSize: 11, color: '#9ca3af' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#059669' },

  empty: { flex: 1 },
  emptyIcon: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, color: '#9ca3af', fontWeight: '500' },
});
