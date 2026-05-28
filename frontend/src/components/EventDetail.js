import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

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

export default function EventDetail({ event, onClose, isFav, isReg, onToggleFav, onToggleReg, regDisabled, regDisabledReason }) {
  const insets = useSafeAreaInsets();
  const icon = categoryIcons[event.category] || 'calendar';
  const startDate = formatDate(event.startDateTime);
  const startTime = formatTime(event.startDateTime);
  const endStr = event.endDateTime
    ? `${formatDate(event.endDateTime)} à ${formatTime(event.endDateTime)}`
    : null;

  async function handleShare() {
    const text = [
      `📌 ${event.title}`,
      `📅 ${startDate} à ${startTime}${endStr ? ` — ${endStr}` : ''}`,
      `📍 ${event.locationName}`,
      event.description ? `\n${event.description}` : '',
      event.capacity ? `\nPlaces : ${event.registeredCount || 0}/${event.capacity}` : '',
    ].join('\n');

    try {
      await Sharing.shareAsync(`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`, {
        dialogTitle: `Partager : ${event.title}`,
        UTI: 'public.plain-text',
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de partager');
    }
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Ionicons name="close" size={28} color="#1c1c1e" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.body}>
        <View style={styles.iconRow}>
          <View style={[styles.iconCircle, { backgroundColor: '#e8e8ed' }]}>
            <Ionicons name={icon} size={26} color="#2563eb" />
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{event.category}</Text>
          </View>
        </View>

        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.description}>{event.description}</Text>

        <View style={styles.infoSection}>
          <InfoRow icon="calendar-outline" label="Début" value={`${startDate} à ${startTime}`} />
          {endStr ? <InfoRow icon="calendar-outline" label="Fin" value={endStr} /> : null}
          <InfoRow icon="location-outline" label="Lieu" value={event.locationName} />
          {event.organizerName ? <InfoRow icon="person-outline" label="Organisateur" value={event.organizerName} /> : null}
          {event.capacity ? (
            <InfoRow
              icon="people-outline"
              label="Capacité"
              value={`${event.registeredCount || 0} / ${event.capacity}`}
            />
          ) : null}
          {event.tags ? (
            <InfoRow icon="pricetags-outline" label="Tags" value={Array.isArray(event.tags) ? event.tags.join(', ') : event.tags} />
          ) : null}
        </View>

        <View style={styles.shareRow}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={styles.shareText}>Partager</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, isFav ? styles.favActive : styles.favInactive]}
            onPress={onToggleFav}
          >
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={20} color={isFav ? '#fff' : '#e11d48'} />
            <Text style={[styles.actionText, isFav ? { color: '#fff' } : { color: '#e11d48' }]}>
              {isFav ? 'Favori' : 'Ajouter aux favoris'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, isReg ? styles.regActive : styles.regInactive, regDisabled && styles.disabled]}
            onPress={onToggleReg}
            disabled={regDisabled && !isReg}
          >
            <Ionicons
              name={isReg ? 'checkmark-circle' : 'add-circle-outline'}
              size={20}
              color={regDisabled && !isReg ? '#94a3b8' : isReg ? '#fff' : '#16a34a'}
            />
            <Text style={[
              styles.actionText,
              isReg ? { color: '#fff' } : regDisabled ? { color: '#94a3b8' } : { color: '#16a34a' },
            ]}>
              {isReg ? 'Inscrit' : regDisabled ? regDisabledReason : "S'inscrire"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={18} color="#64748b" style={{ width: 24 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', paddingBottom: 16, paddingHorizontal: 20,
  },
  backBtn: { width: 40, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1c1c1e' },
  body: { flex: 1, padding: 20 },
  iconRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  iconCircle: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  badge: {
    backgroundColor: '#e8e8ed', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
  },
  badgeText: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 12 },
  description: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 24 },
  infoSection: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  infoLabel: { fontSize: 14, color: '#94a3b8', width: 80 },
  infoValue: { fontSize: 14, color: '#1e293b', fontWeight: '500', flex: 1 },
  shareRow: { alignItems: 'center', marginBottom: 12 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#64748b', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20,
  },
  shareText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 8, padding: 16, borderRadius: 12,
  },
  favActive: { backgroundColor: '#e11d48' },
  favInactive: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#fecdd3' },
  regActive: { backgroundColor: '#16a34a' },
  regInactive: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#bbf7d0' },
  disabled: { opacity: 0.4 },
  actionText: { fontSize: 15, fontWeight: '600' },
});
