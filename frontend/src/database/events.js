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

function serializeTags(tags) {
  if (!tags) return null
  if (Array.isArray(tags)) return JSON.stringify(tags)
  return tags
}

function mapRow(row) {
  if (!row) return null
  return { ...row, tags: parseTags(row.tags) }
}

export function getAllEvents() {
  const db = getDb()
  return db.getAllSync('SELECT * FROM events ORDER BY startDateTime ASC').map(mapRow)
}

export function getEventById(id) {
  const db = getDb()
  return mapRow(db.getFirstSync('SELECT * FROM events WHERE id = ?', [id]))
}

export function createEvent({ title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, imageUrl, tags }) {
  const db = getDb()
  const id = uuid()
  const createdAt = now()
  db.runSync(
    `INSERT INTO events (id, title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, imageUrl, tags, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, title, description || '', category, startDateTime, endDateTime || null, locationName, locationAddress || null, organizerName || '', capacity || null, imageUrl || null, serializeTags(tags), createdAt]
  )
  return getEventById(id)
}

export function updateEvent(id, { title, description, category, startDateTime, endDateTime, locationName, locationAddress, organizerName, capacity, imageUrl, tags }) {
  const db = getDb()
  db.runSync(
    `UPDATE events SET title = ?, description = ?, category = ?, startDateTime = ?, endDateTime = ?, locationName = ?, locationAddress = ?, organizerName = ?, capacity = ?, imageUrl = ?, tags = ? WHERE id = ?`,
    [title, description, category, startDateTime, endDateTime || null, locationName, locationAddress || null, organizerName, capacity || null, imageUrl || null, serializeTags(tags), id]
  )
  return getEventById(id)
}

export function deleteEvent(id) {
  const db = getDb()
  db.runSync('DELETE FROM registrations WHERE eventId = ?', [id])
  db.runSync('DELETE FROM favorites WHERE eventId = ?', [id])
  db.runSync('DELETE FROM events WHERE id = ?', [id])
}


