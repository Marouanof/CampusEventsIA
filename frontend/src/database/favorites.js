import { getDb } from './init'

function now() {
  return new Date().toISOString()
}

function parseTags(raw) {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : raw
  } catch {
    return raw
  }
}

function mapRow(row) {
  if (!row) return null
  return { ...row, tags: parseTags(row.tags) }
}

export function getFavorites(userId) {
  const db = getDb()
  return db.getAllSync(
    `SELECT e.* FROM events e
     INNER JOIN favorites f ON f.eventId = e.id
     WHERE f.userId = ?
     ORDER BY f.createdAt DESC`,
    [userId]
  ).map(mapRow)
}

export function addFavorite(eventId, userId) {
  const db = getDb()
  db.runSync(
    'INSERT OR IGNORE INTO favorites (eventId, userId, createdAt) VALUES (?, ?, ?)',
    [eventId, userId, now()]
  )
}

export function removeFavorite(eventId, userId) {
  const db = getDb()
  db.runSync(
    'DELETE FROM favorites WHERE eventId = ? AND userId = ?',
    [eventId, userId]
  )
}


