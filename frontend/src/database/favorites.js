import { getDb } from './init'

function now() {
  return new Date().toISOString()
}

export function getFavorites(userId) {
  const db = getDb()
  return db.getAllSync(
    `SELECT e.* FROM events e
     INNER JOIN favorites f ON f.eventId = e.id
     WHERE f.userId = ?
     ORDER BY f.createdAt DESC`,
    [userId]
  )
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


