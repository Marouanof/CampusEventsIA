import { getDb } from './init'
import { uuid } from '../utils'

const CACHE_TTL_MS = {
  recommendation: 5 * 60 * 1000,
  weekly: 5 * 60 * 1000,
  search: 24 * 60 * 60 * 1000,
  comparison: 24 * 60 * 60 * 1000,
  planning: 24 * 60 * 60 * 1000,
  qa: 24 * 60 * 60 * 1000,
}

function now() {
  return new Date().toISOString()
}

export function saveLlmResult({ eventId, userId, type, inputText, outputText }) {
  const db = getDb()
  const id = uuid()
  db.runSync(
    'INSERT INTO llm_results (id, eventId, userId, type, inputText, outputText, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, eventId || null, userId, type, inputText, outputText, now()]
  )
  return id
}

export function getCachedResult(userId, type, inputText) {
  const db = getDb()
  const row = db.getFirstSync(
    'SELECT * FROM llm_results WHERE userId = ? AND type = ? AND inputText = ? ORDER BY createdAt DESC LIMIT 1',
    [userId, type, inputText || '']
  )
  if (!row) return null
  const elapsed = Date.now() - new Date(row.createdAt).getTime()
  const ttl = CACHE_TTL_MS[type] || 0
  if (elapsed > ttl) return null
  return row.outputText
}


