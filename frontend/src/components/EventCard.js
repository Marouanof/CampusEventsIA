import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const categoryIcons = {
  Talk: 'mic',
  Workshop: 'build',
  Club: 'people',
  Exam: 'document-text',
  Other: 'calendar',
};

function formatDate(iso) {
  const d = iso.split('T')[0];
  const parts = d.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatTime(iso) {
  const t = iso.split('T')[1];
  return t ? t.substring(0, 5) : '';
}

export default function EventCard({ event, onPress, admin, studentActions, onDelete }) {
  const icon = categoryIcons[event.category] || 'calendar';
  const date = formatDate(event.startDateTime);
  const time = formatTime(event.startDateTime);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(event)} disabled={!onPress && !studentActions}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={20} color="#2563eb" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.detail}>
          <Ionicons name="calendar-outline" size={14} /> {date} à {time}
        </Text>
        {event.locationName ? (
          <Text style={styles.detail}>
            <Ionicons name="location-outline" size={14} /> {event.locationName}
          </Text>
        ) : null}
        {event.description ? (
          <Text style={styles.description} numberOfLines={2}>{event.description}</Text>
        ) : null}
        {studentActions}
      </View>
      {onDelete ? (
        <TouchableOpacity onPress={() => onDelete(event.id)} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      ) : admin ? (
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 16, marginHorizontal: 16, marginVertical: 4,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  iconContainer: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: '#e8e8ed',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
  detail: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  description: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef2f2',
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
});
