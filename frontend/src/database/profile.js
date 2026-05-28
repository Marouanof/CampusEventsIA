import { getDb } from './init'

function now() {
  return new Date().toISOString()
}

export function getProfile(userId) {
  const db = getDb()
  return db.getFirstSync('SELECT * FROM profiles WHERE userId = ?', [userId])
}

export function saveProfile(userId, { fieldOfStudy, year, interests }) {
  const db = getDb()
  const existing = getProfile(userId)
  const data = [fieldOfStudy || '', year || '', interests || '', now(), userId]
  if (existing) {
    db.runSync(
      'UPDATE profiles SET fieldOfStudy = ?, year = ?, interests = ?, updatedAt = ? WHERE userId = ?',
      data
    )
  } else {
    db.runSync(
      'INSERT INTO profiles (fieldOfStudy, year, interests, updatedAt, userId) VALUES (?, ?, ?, ?, ?)',
      data
    )
  }
  return getProfile(userId)
}

export function buildProfileContext(userId) {
  const p = getProfile(userId)
  if (!p || (!p.fieldOfStudy && !p.year && !p.interests)) return null
  const parts = []
  if (p.fieldOfStudy) parts.push(`Filière : ${p.fieldOfStudy}`)
  if (p.year) parts.push(`Année : ${p.year}`)
  if (p.interests) parts.push(`Centres d'intérêt : ${p.interests}`)
  return parts.join('\n')
}
