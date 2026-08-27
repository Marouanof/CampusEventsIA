import { getDb } from './init'

export function getUserById(id) {
  const db = getDb()
  return db.getFirstSync('SELECT * FROM users WHERE id = ?', [id])
}

export function createUser({ id, name, email, role, avatarColor }) {
  const db = getDb()
  const existing = getUserById(id)
  if (existing) return existing
  db.runSync(
    'INSERT OR IGNORE INTO users (id, name, email, role, avatarColor) VALUES (?, ?, ?, ?, ?)',
    [id, name, email, role || 'student', avatarColor || '#6b7280']
  )
  return getUserById(id)
}

export function getRegistrationsByEvent(eventId) {
  const db = getDb()
  return db.getAllSync(
    `SELECT r.id as registrationId, r.createdAt as registeredAt, r.status,
            u.id as userId, u.name, u.email, u.role, u.avatarColor
     FROM registrations r
     INNER JOIN users u ON u.id = r.userId
     WHERE r.eventId = ?
     ORDER BY r.createdAt ASC`,
    [eventId]
  )
}

export function getRegistrationCount(eventId) {
  const db = getDb()
  const row = db.getFirstSync(
    'SELECT COUNT(*) as count FROM registrations WHERE eventId = ?',
    [eventId]
  )
  return row ? row.count : 0
}

export function seedUsers() {
  const db = getDb()
  const users = [
    { id: '1', name: 'Admin', email: 'admin@campus.ma', role: 'admin', avatarColor: '#0040a0' },
    { id: '2', name: 'Étudiant', email: 'etudiant@campus.ma', role: 'student', avatarColor: '#059669' },
    { id: 'u3', name: 'Sara Alaoui', email: 'sara@campus.ma', role: 'student', avatarColor: '#e11d48' },
    { id: 'u4', name: 'Youssef Benkirane', email: 'youssef@campus.ma', role: 'student', avatarColor: '#7c3aed' },
    { id: 'u5', name: 'Fatima Zahra Amrani', email: 'fatima@campus.ma', role: 'student', avatarColor: '#ea580c' },
    { id: 'u6', name: 'Omar Tazi', email: 'omar@campus.ma', role: 'student', avatarColor: '#0891b2' },
    { id: 'u7', name: 'Nadia Berrada', email: 'nadia@campus.ma', role: 'student', avatarColor: '#be185d' },
    { id: 'u8', name: 'Karim Idrissi', email: 'karim@campus.ma', role: 'student', avatarColor: '#4f46e5' },
    { id: 'u9', name: 'Leila Moussaoui', email: 'leila@campus.ma', role: 'student', avatarColor: '#059669' },
    { id: 'u10', name: 'Hamza Fassi', email: 'hamza@campus.ma', role: 'student', avatarColor: '#ca8a04' },
    { id: 'u11', name: 'Amina Chakir', email: 'amina@campus.ma', role: 'student', avatarColor: '#dc2626' },
    { id: 'u12', name: 'Rachid El Fassi', email: 'rachid@campus.ma', role: 'student', avatarColor: '#2563eb' },
  ]

  for (const u of users) {
    db.runSync(
      'INSERT OR IGNORE INTO users (id, name, email, role, avatarColor) VALUES (?, ?, ?, ?, ?)',
      [u.id, u.name, u.email, u.role, u.avatarColor]
    )
  }
}

export function seedRegistrations() {
  const db = getDb()

  const eventCount = db.getFirstSync('SELECT COUNT(*) as c FROM events')
  if (!eventCount || eventCount.c === 0) return

  const regCount = db.getFirstSync('SELECT COUNT(*) as c FROM registrations')
  if (regCount && regCount.c > 0) return

  const events = db.getAllSync('SELECT id, title FROM events ORDER BY startDateTime ASC')
  const studentIds = ['u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10', 'u11', 'u12']

  const registrations = [
    { eventTitle: 'Introduction au Machine Learning', users: ['u3', 'u4', 'u5', 'u6', 'u7'] },
    { eventTitle: 'Atelier React Native', users: ['u3', 'u5', 'u8'] },
    { eventTitle: 'Club de Robotique', users: ['u4', 'u6', 'u9'] },
    { eventTitle: 'Examen Algèbre Linéaire', users: ['u3', 'u7', 'u10'] },
    { eventTitle: 'Hackathon Innovation', users: ['u3', 'u4', 'u5', 'u8', 'u11'] },
    { eventTitle: 'Conférence Cloud Computing', users: ['u6', 'u9', 'u12'] },
    { eventTitle: 'Atelier Python Data Science', users: ['u3', 'u4', 'u7'] },
    { eventTitle: 'Club de Théâtre', users: ['u5', 'u10'] },
    { eventTitle: 'Examen POO Java', users: ['u8', 'u11', 'u12'] },
    { eventTitle: 'Séminaire IA Générative', users: ['u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10'] },
    { eventTitle: 'Atelier Git & GitHub', users: ['u3', 'u6', 'u11'] },
    { eventTitle: 'Club de Débat', users: ['u4', 'u7', 'u12'] },
    { eventTitle: 'Examen Base de Données', users: ['u5', 'u8', 'u9'] },
    { eventTitle: 'Conférence Cybersécurité', users: ['u3', 'u10', 'u11', 'u12'] },
    { eventTitle: 'Atelier Docker & Kubernetes', users: ['u6', 'u9'] },
    { eventTitle: 'Sortie Musée des Sciences', users: ['u3', 'u4', 'u7', 'u12'] },
    { eventTitle: 'Conférence IA & Éthique', users: ['u3', 'u4', 'u5', 'u11'] },
    { eventTitle: 'Atelier Flutter', users: ['u3', 'u6'] },
    { eventTitle: 'Club Photo', users: ['u5', 'u8', 'u10'] },
  ]

  const now = new Date().toISOString()
  for (const reg of registrations) {
    const ev = events.find(e => e.title === reg.eventTitle)
    if (!ev) continue
    for (const userId of reg.users) {
      const user = db.getFirstSync('SELECT 1 FROM users WHERE id = ?', [userId])
      if (!user) continue
      const id = `reg-${ev.id.slice(0, 8)}-${userId}`
      db.runSync(
        'INSERT OR IGNORE INTO registrations (id, eventId, userId, createdAt, status) VALUES (?, ?, ?, ?, ?)',
        [id, ev.id, userId, now, 'confirmed']
      )
    }
  }
}
