import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { categoryConfig, formatDate, formatTime } from '../utils';

export default function EventDetail({ event, onClose, isFav, isReg, onToggleFav, onToggleReg, regDisabled, regDisabledReason }) {
  const insets = useSafeAreaInsets();
  const cat = categoryConfig[event.category] || categoryConfig.Other;
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
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.topRow}>
          <View style={[styles.iconCircle, { backgroundColor: cat.bg }]}>
            <Ionicons name={cat.icon} size={24} color={cat.color} />
          </View>
          <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
            <Text style={[styles.catBadgeText, { color: cat.color }]}>{cat.label}</Text>
          </View>
        </View>

        <Text style={styles.title}>{event.title}</Text>
        {event.description ? <Text style={styles.description}>{event.description}</Text> : null}

        <View style={styles.infoCard}>
          <InfoRow icon="time-outline" label="Début" value={`${startDate} à ${startTime}`} />
          {endStr ? <InfoRow icon="time-outline" label="Fin" value={endStr} /> : null}
          <InfoRow icon="location-outline" label="Lieu" value={event.locationName} />
          {event.organizerName ? <InfoRow icon="person-outline" label="Organisateur" value={event.organizerName} /> : null}
          {event.capacity ? (
            <InfoRow
              icon="people-outline"
              label="Places"
              value={`${event.registeredCount || 0} / ${event.capacity}`}
            />
          ) : null}
          {event.tags && event.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              <Ionicons name="pricetags-outline" size={14} color="#9ca3af" />
              <View style={styles.tags}>
                {(Array.isArray(event.tags) ? event.tags : [event.tags]).map((tag, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={17} color="#0040a0" />
          <Text style={styles.shareText}>Partager cet événement</Text>
        </TouchableOpacity>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionBtn, isFav ? styles.favActive : styles.favInactive]}
            onPress={onToggleFav}
            activeOpacity={0.8}
          >
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={19} color={isFav ? '#fff' : '#e11d48'} />
            <Text style={[styles.actionText, isFav ? { color: '#fff' } : { color: '#e11d48' }]}>
              {isFav ? 'Favori ajouté' : 'Ajouter aux favoris'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, isReg ? styles.regActive : styles.regInactive, regDisabled && !isReg && styles.disabled]}
            onPress={onToggleReg}
            disabled={regDisabled && !isReg}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isReg ? 'checkmark-circle' : 'add-circle-outline'}
              size={19}
              color={regDisabled && !isReg ? '#9ca3af' : isReg ? '#fff' : '#0040a0'}
            />
            <Text style={[
              styles.actionText,
              isReg ? { color: '#fff' } : regDisabled ? { color: '#9ca3af' } : { color: '#0040a0' },
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
      <Ionicons name={icon} size={16} color="#9ca3af" style={{ width: 22 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#ffffff', paddingBottom: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  closeBtn: { padding: 6, borderRadius: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#0f172a' },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 16 },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconCircle: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  catBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  catBadgeText: { fontSize: 13, fontWeight: '600' },

  title: { fontSize: 22, fontWeight: '700', color: '#0f172a', lineHeight: 28 },
  description: { fontSize: 15, color: '#4b5563', lineHeight: 22 },

  infoCard: {
    backgroundColor: '#ffffff', borderRadius: 14, padding: 16, gap: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  infoLabel: { fontSize: 13, color: '#9ca3af', width: 85, fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#0f172a', fontWeight: '500', flex: 1 },

  tagsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingTop: 11 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  tag: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, fontWeight: '500', color: '#4b5563' },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 12,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  shareText: { fontSize: 14, fontWeight: '500', color: '#0040a0' },

  actions: { flexDirection: 'row', gap: 10, paddingBottom: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 7, padding: 14, borderRadius: 12,
  },
  favActive: { backgroundColor: '#e11d48' },
  favInactive: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#fecdd3' },
  regActive: { backgroundColor: '#0040a0' },
  regInactive: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#dbeafe' },
  disabled: { opacity: 0.4 },
  actionText: { fontSize: 14, fontWeight: '600' },
});
