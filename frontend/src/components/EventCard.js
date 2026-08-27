import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { categoryConfig, formatDate, formatTime } from '../utils';

export default function EventCard({ event, onPress, admin, studentActions, onDelete }) {
  const cat = categoryConfig[event.category] || categoryConfig.Other;
  const date = formatDate(event.startDateTime);
  const time = formatTime(event.startDateTime);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(event)} disabled={!onPress && !studentActions}>
      <View style={[styles.iconContainer, { backgroundColor: cat.bg }]}>
        <Ionicons name={cat.icon} size={20} color={cat.color} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
          {event.capacity ? (
            <View style={styles.capacityBadge}>
              <Text style={styles.capacityText}>{event.registeredCount || 0}/{event.capacity}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={13} color="#9ca3af" />
          <Text style={styles.detail}>{date} · {time}</Text>
        </View>
        {event.locationName ? (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={13} color="#9ca3af" />
            <Text style={styles.detail}>{event.locationName}</Text>
          </View>
        ) : null}
        {studentActions}
      </View>
      {onDelete ? (
        <TouchableOpacity onPress={() => onDelete(event.id)} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="trash-outline" size={17} color="#dc2626" />
        </TouchableOpacity>
      ) : admin ? (
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 14, padding: 14, marginHorizontal: 16, marginVertical: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  iconContainer: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  content: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '600', color: '#0f172a', flex: 1 },
  capacityBadge: {
    backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  capacityText: { fontSize: 11, fontWeight: '500', color: '#64748b' },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detail: { fontSize: 13, color: '#6b7280' },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#fef2f2',
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
});
