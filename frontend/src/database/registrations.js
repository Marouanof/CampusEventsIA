import { getDb } from './init'
import { uuid } from '../utils'

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

export function getRegistrations(userId) {
  const db = getDb()
  return db.getAllSync(
    `SELECT e.*, r.status as registrationStatus, r.createdAt as registeredAt, r.notificationId
     FROM events e
     INNER JOIN registrations r ON r.eventId = e.id
     WHERE r.userId = ?
     ORDER BY r.createdAt DESC`,
    [userId]
  ).map(mapRow)
}

export function getRegistrationNotificationId(eventId, userId) {
  const db = getDb()
  const row = db.getFirstSync(
    'SELECT notificationId FROM registrations WHERE eventId = ? AND userId = ?',
    [eventId, userId]
  )
  return row ? row.notificationId : null
}

export function registerForEvent(eventId, userId) {
  const db = getDb()
  const existing = db.getFirstSync(
    'SELECT id FROM registrations WHERE eventId = ? AND userId = ?',
    [eventId, userId]
  )
  if (existing) return false

  const event = db.getFirstSync(
    'SELECT capacity, registeredCount, startDateTime FROM events WHERE id = ?',
    [eventId]
  )
  if (!event) return false
  if (new Date(event.startDateTime) < new Date()) return false
  if (event.capacity && event.registeredCount >= event.capacity) return false

  const id = uuid()

  db.runSync(
    'INSERT INTO registrations (id, eventId, userId, createdAt, status) VALUES (?, ?, ?, ?, ?)',
    [id, eventId, userId, now(), 'confirmed']
  )
  db.runSync(
    'UPDATE events SET registeredCount = registeredCount + 1 WHERE id = ?',
    [eventId]
  )
  return true
}

export function updateRegistrationNotificationId(eventId, userId, notificationId) {
  const db = getDb()
  db.runSync(
    'UPDATE registrations SET notificationId = ? WHERE eventId = ? AND userId = ?',
    [notificationId, eventId, userId]
  )
}

export function unregisterFromEvent(eventId, userId) {
  const db = getDb()
  db.runSync(
    'DELETE FROM registrations WHERE eventId = ? AND userId = ?',
    [eventId, userId]
  )
  db.runSync(
    'UPDATE events SET registeredCount = MAX(0, registeredCount - 1) WHERE id = ?',
    [eventId]
  )
}

export function isEventFull(eventId) {
  const db = getDb()
  const event = db.getFirstSync(
    'SELECT capacity, registeredCount FROM events WHERE id = ?',
    [eventId]
  )
  if (!event || !event.capacity) return false
  return event.registeredCount >= event.capacity
}

export function isEventPast(startDateTime) {
  return new Date(startDateTime) < new Date()
}
