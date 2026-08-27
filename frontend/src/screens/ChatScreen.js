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
  { key: 'search', label: 'Recherche' },
  { key: 'recommendation', label: 'Pour toi' },
  { key: 'comparison', label: 'Comparer' },
  { key: 'planning', label: 'Planning' },
  { key: 'weekly', label: 'Résumé' },
  { key: 'qa', label: 'Questions' },
];

const PLACEHOLDER = {
  search: "Ex: événements sur l'IA ce weekend",
  comparison: 'Ex: compare le Hackathon et le Workshop ML',
  planning: "Ex: j'ai cours lundi et mercredi matin",
  qa: 'Ex: y a-t-il des événements data science ?',
};

function fmtTags(tags) {
  if (!tags) return '';
  return Array.isArray(tags) ? tags.join(', ') : tags;
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
  return getAllEvents().filter(e => new Date(e.startDateTime) >= new Date());
}

function getWeekEvents() {
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  endOfWeek.setHours(23, 59, 59, 999);
  return getAllEvents().filter(e => {
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
  const isAutoMode = mode === 'recommendation' || mode === 'weekly';

  function getEventsForMode() {
    if (mode === 'planning' || mode === 'weekly') return getWeekEvents();
    if (mode === 'recommendation') return getUpcomingEvents();
    return getAllEvents();
  }

  async function fetchRecommendations() {
    if (isBusy) return;
    const cachedResult = getCachedResult(user?.id, 'recommendation', '');
    if (cachedResult) { setResult(cachedResult); setCached(true); setStatus('done'); return; }
    setStatus('loading'); setError(null); setResult(null); setCached(false);
    try {
      const response = await sendToLLM('recommendation', getEventsForMode(), '', buildContext(user));
      setResult(response); setStatus('done');
      if (user) saveLlmResult({ userId: user.id, type: 'recommendation', inputText: '', outputText: response });
    } catch (err) { setError(err.message); setStatus('error'); }
  }

  async function fetchWeeklySummary() {
    if (isBusy) return;
    const cachedResult = getCachedResult(user?.id, 'weekly', '');
    if (cachedResult) { setResult(cachedResult); setCached(true); setStatus('done'); return; }
    setStatus('loading'); setError(null); setResult(null); setCached(false);
    try {
      const response = await sendToLLM('weekly', getWeekEvents(), '', '');
      setResult(response); setStatus('done');
      if (user) saveLlmResult({ userId: user.id, type: 'weekly', inputText: '', outputText: response });
    } catch (err) { setError(err.message); setStatus('error'); }
  }

  async function handleSend() {
    if (!input.trim() || isBusy) return;
    const inputText = input.trim();
    lastQueryRef.current = inputText;
    setInput('');
    const cacheKey = inputText.toLowerCase().replace(/\s+/g, ' ');
    const cachedResult = getCachedResult(user?.id, mode, cacheKey);
    if (cachedResult) { setResult(cachedResult); setCached(true); setStatus('done'); return; }
    setStatus('loading'); setError(null); setResult(null); setCached(false);
    try {
      const context = mode === 'qa' || mode === 'comparison' ? buildContext(user) : '';
      const response = await sendToLLM(mode, getEventsForMode(), inputText, context);
      setResult(response); setStatus('done');
      if (user) saveLlmResult({ userId: user.id, type: mode, inputText: cacheKey, outputText: response });
    } catch (err) { setError(err.message); setStatus('error'); }
  }

  async function handleRetry() {
    if (isBusy) return;
    if (mode === 'recommendation') return fetchRecommendations();
    if (mode === 'weekly') return fetchWeeklySummary();
    const text = lastQueryRef.current;
    if (!text) return;
    setStatus('loading'); setError(null); setResult(null); setCached(false);
    try {
      const context = mode === 'qa' || mode === 'comparison' ? buildContext(user) : '';
      const response = await sendToLLM(mode, getEventsForMode(), text, context);
      setResult(response); setStatus('done');
      if (user) saveLlmResult({ userId: user.id, type: mode, inputText: text.toLowerCase().replace(/\s+/g, ' '), outputText: response });
    } catch (err) { setError(err.message); setStatus('error'); }
  }

  function handleModeChange(newMode) {
    if (isBusy) return;
    setMode(newMode); setResult(null); setError(null); setStatus('idle'); setCached(false); setInput('');
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {!embedded && (
        <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Assistant IA</Text>
          <View style={{ width: 28 }} />
        </View>
      )}

      <View style={styles.tabBar}>
        {MODES.map(m => {
          const active = mode === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              style={styles.tab}
              onPress={() => handleModeChange(m.key)}
              disabled={isBusy}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{m.label}</Text>
              {active && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {status === 'loading' && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#0040a0" />
            <Text style={styles.loadingText}>Recherche en cours...</Text>
          </View>
        )}

        {status === 'error' && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={handleRetry} disabled={isBusy} activeOpacity={0.8}>
              <Ionicons name="refresh" size={11} color="#fff" />
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'done' && result && (
          <View style={styles.resultBox}>
            {cached && (
              <View style={styles.cacheBadge}>
                <Ionicons name="time-outline" size={10} color="#6b7280" />
                <Text style={styles.cacheText}>Cache</Text>
              </View>
            )}
            <Text style={styles.resultText}>{result}</Text>
          </View>
        )}

        {status === 'idle' && (
          <View style={styles.idleBox}>
            <Ionicons name="sparkles-outline" size={24} color="#d1d5db" />
            <Text style={styles.idleHint}>
              {isAutoMode
                ? mode === 'recommendation'
                  ? 'Suggestions personnalisées basées sur ton profil'
                  : 'Récap automatique des événements de la semaine'
                : mode === 'search' ? 'Recherche en langage naturel'
                : mode === 'comparison' ? 'Compare deux événements'
                : mode === 'planning' ? 'Organise ta semaine'
                : 'Pose une question sur le catalogue'}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 4 }]}>
        {isAutoMode ? (
          <TouchableOpacity
            style={[styles.launchBtn, isBusy && styles.btnDisabled]}
            onPress={mode === 'recommendation' ? fetchRecommendations : fetchWeeklySummary}
            disabled={isBusy}
            activeOpacity={0.8}
          >
            {isBusy ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Ionicons name="sparkles" size={13} color="#fff" />
                <Text style={styles.launchText}>Générer</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={PLACEHOLDER[mode]}
              placeholderTextColor="#9ca3af"
              multiline
              editable={!isBusy}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || isBusy) && styles.btnDisabled]}
              onPress={handleSend}
              disabled={isBusy || !input.trim()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-up" size={16} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f2f5' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ffffff', paddingBottom: 8, paddingHorizontal: 14,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },

  tabBar: {
    flexDirection: 'row', backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  tab: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    position: 'relative',
  },
  tabLabel: { fontSize: 12, fontWeight: '500', color: '#9ca3af' },
  tabLabelActive: { fontSize: 12, fontWeight: '700', color: '#0040a0' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: '25%', right: '25%',
    height: 2.5, borderRadius: 2, backgroundColor: '#0040a0',
  },

  content: { flex: 1 },
  contentInner: { padding: 10, flexGrow: 1 },

  loadingBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  loadingText: { fontSize: 12, color: '#6b7280' },

  errorBox: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  errorText: { fontSize: 12, color: '#dc2626', textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#dc2626', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8,
  },
  retryText: { fontSize: 11, fontWeight: '600', color: '#fff' },

  resultBox: {
    backgroundColor: '#ffffff', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#e5e7eb',
  },
  cacheBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    marginBottom: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  cacheText: { fontSize: 10, color: '#6b7280', fontWeight: '500' },
  resultText: { fontSize: 13, color: '#0f172a', lineHeight: 20 },

  idleBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 16, gap: 6 },
  idleHint: { fontSize: 12, color: '#9ca3af', textAlign: 'center' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 6,
    paddingHorizontal: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1, backgroundColor: '#f8fafc', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 13,
    maxHeight: 64, color: '#0f172a', borderWidth: 1, borderColor: '#e5e7eb',
  },
  sendBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#0040a0',
    justifyContent: 'center', alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  launchBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, backgroundColor: '#0040a0', borderRadius: 8, paddingVertical: 8,
  },
  launchText: { fontSize: 13, fontWeight: '600', color: '#fff' },
});
