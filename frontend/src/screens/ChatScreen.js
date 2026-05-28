import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { sendToLLM } from '../services/llm';
import { saveLlmResult, getCachedResult } from '../database/llmResults';
import { getAllEvents } from '../database/events';
import { getFavorites } from '../database/favorites';
import { getRegistrations } from '../database/registrations';
import { buildProfileContext } from '../database/profile';

const MODES = [
  { key: 'search', label: 'Recherche', icon: 'search' },
  { key: 'recommendation', label: 'Recommandations', icon: 'star' },
  { key: 'comparison', label: 'Comparer', icon: 'git-compare' },
  { key: 'planning', label: 'Planning', icon: 'calendar' },
  { key: 'weekly', label: 'Résumé', icon: 'newspaper' },
  { key: 'qa', label: 'Questions', icon: 'help-circle' },
];

function fmtTags(tags) {
  if (!tags) return ''
  return Array.isArray(tags) ? tags.join(', ') : tags
}

function buildContext(user) {
  if (!user) return '';
  const profileCtx = buildProfileContext(user.id);
  const favs = getFavorites(user.id);
  const regs = getRegistrations(user.id);

  let parts = [];
  if (profileCtx) parts.push(profileCtx);
  if (favs.length > 0) {
    parts.push('Favoris :');
    favs.forEach(e => parts.push(`  - ${e.title} (${e.category})${e.tags ? ` [${fmtTags(e.tags)}]` : ''}`));
  }
  if (regs.length > 0) {
    parts.push('Inscriptions :');
    regs.forEach(e => parts.push(`  - ${e.title} (${e.category})${e.tags ? ` [${fmtTags(e.tags)}]` : ''}`));
  }
  return parts.join('\n') || 'Aucun historique.';
}

function getUpcomingEvents() {
  const all = getAllEvents();
  const now = new Date();
  return all.filter(e => new Date(e.startDateTime) >= now);
}

function getWeekEvents() {
  const all = getAllEvents();
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);
  return all.filter(e => {
    const d = new Date(e.startDateTime);
    return d >= now && d <= endOfWeek;
  });
}

export default function ChatScreen({ onBack, user, embedded }) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('search');
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const [cached, setCached] = useState(false);
  const lastQueryRef = useRef('');

  const isBusy = status === 'loading';

  function getEventsForMode() {
    if (mode === 'planning' || mode === 'weekly') return getWeekEvents();
    if (mode === 'recommendation') return getUpcomingEvents();
    return getAllEvents();
  }

  async function fetchRecommendations() {
    if (isBusy) return;

    const cachedResult = getCachedResult(user?.id, 'recommendation', '');
    if (cachedResult) {
      setResult(cachedResult);
      setCached(true);
      setStatus('done');
      return;
    }

    setStatus('loading');
    setError(null);
    setResult(null);
    setCached(false);

    try {
      const events = getEventsForMode();
      const context = buildContext(user);
      const response = await sendToLLM('recommendation', events, '', context);
      setResult(response);
      setStatus('done');

      if (user) {
        saveLlmResult({ userId: user.id, type: 'recommendation', inputText: '', outputText: response });
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  async function fetchWeeklySummary() {
    if (isBusy) return;

    const cachedResult = getCachedResult(user?.id, 'weekly', '');
    if (cachedResult) {
      setResult(cachedResult);
      setCached(true);
      setStatus('done');
      return;
    }

    setStatus('loading');
    setError(null);
    setResult(null);
    setCached(false);

    try {
      const events = getEventsForMode();
      const response = await sendToLLM('weekly', events, '', '');
      setResult(response);
      setStatus('done');

      if (user) {
        saveLlmResult({ userId: user.id, type: 'weekly', inputText: '', outputText: response });
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  async function handleSend() {
    if (!input.trim() || isBusy) return;

    const inputText = input.trim();
    lastQueryRef.current = inputText;
    setInput('');

    const cacheKey = inputText.toLowerCase().replace(/\s+/g, ' ');
    const cachedResult = getCachedResult(user?.id, mode, cacheKey);
    if (cachedResult) {
      setResult(cachedResult);
      setCached(true);
      setStatus('done');
      return;
    }

    setStatus('loading');
    setError(null);
    setResult(null);
    setCached(false);

    try {
      const events = getEventsForMode();
      const context = mode === 'qa' || mode === 'comparison' ? buildContext(user) : '';
      const response = await sendToLLM(mode, events, inputText, context);
      setResult(response);
      setStatus('done');

      if (user) {
        saveLlmResult({ userId: user.id, type: mode, inputText: cacheKey, outputText: response });
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  async function handleRetry() {
    if (isBusy) return;
    if (mode === 'recommendation') return fetchRecommendations();
    if (mode === 'weekly') return fetchWeeklySummary();
    const text = lastQueryRef.current;
    if (!text) return;

    setStatus('loading');
    setError(null);
    setResult(null);
    setCached(false);

    try {
      const events = getEventsForMode();
      const context = mode === 'qa' || mode === 'comparison' ? buildContext(user) : '';
      const response = await sendToLLM(mode, events, text, context);
      setResult(response);
      setStatus('done');
      if (user) {
        const cacheKey = text.toLowerCase().replace(/\s+/g, ' ');
        saveLlmResult({ userId: user.id, type: mode, inputText: cacheKey, outputText: response });
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }

  function handleModeChange(newMode) {
    if (isBusy) return;
    setMode(newMode);
    setResult(null);
    setError(null);
    setStatus('idle');
    setCached(false);
    setInput('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {!embedded && (
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#1c1c1e" />
          </TouchableOpacity>
          <Text style={styles.title}>Assistant</Text>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {MODES.map(m => {
          const active = mode === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => handleModeChange(m.key)}
              disabled={isBusy}
            >
              <Ionicons
                name={m.icon}
                size={12}
                color={active ? '#1c1c1e' : '#64748b'}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {!['recommendation', 'weekly'].includes(mode) && (
          <Text style={styles.modeHint}>
            {mode === 'search' && 'Exprime ta recherche en langage naturel'}
            {mode === 'comparison' && 'Compare deux événements (ex: "Lequel est mieux entre X et Y ?")'}
            {mode === 'planning' && 'Décris tes contraintes horaires'}
            {mode === 'qa' && 'Pose une question sur le catalogue'}
          </Text>
        )}

        <View style={styles.securityBanner}>
          <Ionicons name="shield-outline" size={14} color="#8e8e93" />
          <Text style={styles.securityText}>
            Ne soumettez pas de données personnelles ou sensibles
          </Text>
        </View>

        {status === 'loading' && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Réflexion en cours...</Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle" size={48} color="#ef4444" />
            <Text style={styles.errorTitle}>Erreur</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={handleRetry}
              disabled={isBusy}
            >
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'done' && !result && (
          <View style={styles.centerBox}>
            <Ionicons name="document-text-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>Aucun résultat</Text>
          </View>
        )}

        {status === 'done' && result && (
          <View style={styles.resultBox}>
            {cached && (
              <View style={styles.cacheBadge}>
                <Ionicons name="time-outline" size={14} color="#64748b" />
                <Text style={styles.cacheText}>Résultat en cache</Text>
              </View>
            )}
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}

        {status === 'idle' && ['recommendation', 'weekly'].includes(mode) && (
          <View style={styles.centerBox}>
            <Ionicons name={mode === 'recommendation' ? 'star-outline' : 'newspaper-outline'} size={48} color="#94a3b8" />
            <Text style={styles.recoEmpty}>
              {mode === 'recommendation' ? 'Appuie sur "Lancer" pour obtenir des recommandations personnalisées' : 'Appuie sur "Lancer" pour générer le résumé de la semaine'}
            </Text>
          </View>
        )}

        {status === 'idle' && !['recommendation', 'weekly'].includes(mode) && (
          <View style={styles.centerBox}>
            <Ionicons
              name={mode === 'search' ? 'search' : mode === 'comparison' ? 'git-compare' : mode === 'planning' ? 'calendar-outline' : 'help-circle-outline'}
              size={48} color="#94a3b8"
            />
            <Text style={styles.recoEmpty}>
              {mode === 'search' && 'Tape ta requête ci-dessous pour chercher des événements'}
              {mode === 'comparison' && 'Tape "Compare X et Y" ou décris les événements à comparer'}
              {mode === 'planning' && 'Tape tes disponibilités pour obtenir un planning'}
              {mode === 'qa' && 'Tape ta question sur le catalogue'}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 4 }]}>
        {['recommendation', 'weekly'].includes(mode) ? (
          <TouchableOpacity
            style={[styles.launchBtn, isBusy && styles.btnDisabled]}
            onPress={mode === 'recommendation' ? fetchRecommendations : fetchWeeklySummary}
            disabled={isBusy}
          >
            {isBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#fff" />
                <Text style={styles.launchText}>Lancer</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={
                mode === 'search' ? 'Ex: quelque chose sur l\'IA ce weekend' :
                mode === 'comparison' ? 'Ex: compare le Hackathon et le Workshop ML' :
                mode === 'planning' ? 'Ex: j\'ai cours lundi et mercredi matin' :
                'Ex: y a-t-il des événements data science ?'
              }
              placeholderTextColor="#94a3b8"
              multiline
              editable={!isBusy}
            />
            <TouchableOpacity
              style={[styles.sendBtn, isBusy && styles.btnDisabled]}
              onPress={handleSend}
              disabled={isBusy}
            >
              {isBusy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ffffff', paddingBottom: 16, paddingHorizontal: 20,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1c1c1e' },
  tabBar: {
    backgroundColor: '#fff',
    paddingLeft: 6, paddingVertical: 6,
    borderBottomWidth: 1, borderColor: '#e2e8f0',
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    marginHorizontal: 1, backgroundColor: '#f1f5f9',
  },
  tabActive: { backgroundColor: '#e8e8ed' },
  tabLabel: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  tabLabelActive: { color: '#1c1c1e' },
  content: { flex: 1 },
  contentInner: { padding: 16, flexGrow: 1 },
  modeHint: {
    fontSize: 14, color: '#64748b', textAlign: 'center',
    marginBottom: 16, fontStyle: 'italic',
  },
  centerBox: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, gap: 12,
  },
  loadingText: { fontSize: 15, color: '#64748b', marginTop: 8 },
  errorTitle: { fontSize: 18, fontWeight: 'bold', color: '#ef4444' },
  errorText: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 8, marginTop: 8,
  },
  retryText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  emptyText: { fontSize: 15, color: '#94a3b8' },
  securityBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f5f5f7', borderWidth: 1, borderColor: '#d1d1d6',
    borderRadius: 8, padding: 10, marginBottom: 12,
  },
  securityText: { fontSize: 12, color: '#8e8e93', flex: 1 },
  recoEmpty: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  resultBox: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  cacheBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginBottom: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderColor: '#f1f5f9',
  },
  cacheText: { fontSize: 12, color: '#64748b' },
  resultText: { fontSize: 15, color: '#1e293b', lineHeight: 22 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, borderTopWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff',
  },
  input: {
    flex: 1, backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15, maxHeight: 80, color: '#1e293b',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#2563eb',
    justifyContent: 'center', alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  launchBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#2563eb', borderRadius: 12,
    paddingVertical: 12, marginHorizontal: 4,
  },
  launchText: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
});
