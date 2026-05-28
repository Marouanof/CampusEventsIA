import { getDb } from './init'
import { uuid } from '../utils'

const SAMPLE_EVENTS = [
  {
    title: 'Introduction au Machine Learning',
    description: 'Découvrez les bases du machine learning avec des exemples pratiques',
    category: 'Talk',
    startDateTime: '2026-06-01T09:00:00.000Z',
    endDateTime: '2026-06-01T11:00:00.000Z',
    locationName: 'Amphi A',
    organizerName: 'Dr. Benali',
    capacity: 100,
    registeredCount: 33,
    tags: JSON.stringify(['IA', 'machine learning', 'débutant']),
  },
  {
    title: 'Atelier React Native',
    description: 'Atelier pratique pour construire une app mobile avec React Native',
    category: 'Workshop',
    startDateTime: '2026-06-03T14:00:00.000Z',
    endDateTime: '2026-06-03T17:00:00.000Z',
    locationName: 'Salle TP 3',
    organizerName: 'Professeur Martin',
    capacity: 30,
    registeredCount: 15,
    tags: JSON.stringify(['React Native', 'mobile', 'workshop']),
  },
  {
    title: 'Club de Robotique',
    description: 'Réunion hebdomadaire du club de robotique',
    category: 'Club',
    startDateTime: '2026-06-05T18:00:00.000Z',
    endDateTime: null,
    locationName: 'Labo Informatique',
    organizerName: 'Club Robotique',
    capacity: 20,
    registeredCount: 20,
    tags: JSON.stringify(['robotique', 'club', 'pratique']),
  },
  {
    title: 'Examen d\'Algèbre Linéaire',
    description: 'Examen final du module d\'algèbre linéaire - durée 3h',
    category: 'Exam',
    startDateTime: '2026-06-10T08:30:00.000Z',
    endDateTime: null,
    locationName: 'Salle 201',
    organizerName: 'Département Maths',
    capacity: 60,
    registeredCount: 60,
    tags: JSON.stringify(['examen', 'algèbre', 'L2']),
  },
  {
    title: 'Hackathon Innovation',
    description: '48h pour créer un projet innovant en équipe',
    category: 'Other',
    startDateTime: '2026-06-20T09:00:00.000Z',
    endDateTime: '2026-06-22T09:00:00.000Z',
    locationName: 'Espace Innovation',
    organizerName: 'Bureau des Étudiants',
    capacity: 80,
    registeredCount: 41,
    tags: JSON.stringify(['hackathon', 'innovation', 'compétition']),
  },
]

const MORE_EVENTS = [
  {
    title: 'Conférence Cloud Computing',
    description: 'Les fondamentaux du cloud : AWS, Azure et bonnes pratiques DevOps.',
    category: 'Talk',
    startDateTime: '2026-05-29T10:00:00.000Z',
    endDateTime: '2026-05-29T12:00:00.000Z',
    locationName: 'Amphi C',
    organizerName: 'Dr. El Amrani',
    capacity: 120,
    registeredCount: 45,
    tags: JSON.stringify(['cloud', 'AWS', 'Azure', 'DevOps']),
  },
  {
    title: 'Atelier Python Data Science',
    description: 'Manipulation de données avec Pandas, NumPy et visualisation Matplotlib.',
    category: 'Workshop',
    startDateTime: '2026-05-31T14:00:00.000Z',
    endDateTime: '2026-05-31T17:00:00.000Z',
    locationName: 'Salle TP 1',
    organizerName: 'Professeur Karim',
    capacity: 25,
    registeredCount: 25,
    tags: JSON.stringify(['Python', 'Data Science', 'Pandas']),
  },
  {
    title: 'Club de Théâtre',
    description: 'Réunion d\'organisation et atelier d\'improvisation pour le spectacle de fin d\'année.',
    category: 'Club',
    startDateTime: '2026-06-02T17:00:00.000Z',
    endDateTime: '2026-06-02T19:00:00.000Z',
    locationName: 'Salle Polyvalente',
    organizerName: 'Club Théâtre',
    capacity: 40,
    registeredCount: 12,
    tags: JSON.stringify(['théâtre', 'improvisation', 'culture']),
  },
  {
    title: 'Examen Programmation Orientée Objet',
    description: 'Examen final du module POO en Java — durée 2h.',
    category: 'Exam',
    startDateTime: '2026-06-04T08:30:00.000Z',
    endDateTime: '2026-06-04T10:30:00.000Z',
    locationName: 'Salle 203',
    organizerName: 'Département Informatique',
    capacity: 50,
    registeredCount: 50,
    tags: JSON.stringify(['examen', 'POO', 'Java', 'L2']),
  },
  {
    title: 'Séminaire IA Générative',
    description: 'Découvrez ChatGPT, DALL-E et l\'impact de l\'IA générative sur le monde professionnel.',
    category: 'Talk',
    startDateTime: '2026-06-06T10:00:00.000Z',
    endDateTime: '2026-06-06T12:00:00.000Z',
    locationName: 'Grand Amphi',
    organizerName: 'Dr. Benali',
    capacity: 200,
    registeredCount: 88,
    tags: JSON.stringify(['IA', 'ChatGPT', 'générative', 'GPT']),
  },
  {
    title: 'Atelier Git & GitHub',
    description: 'Apprenez les bases de Git : branches, commits, pull requests et collaboration.',
    category: 'Workshop',
    startDateTime: '2026-06-08T14:00:00.000Z',
    endDateTime: '2026-06-08T16:00:00.000Z',
    locationName: 'Salle TP 2',
    organizerName: 'Club Dev',
    capacity: 30,
    registeredCount: 30,
    tags: JSON.stringify(['Git', 'GitHub', 'versioning', 'collaboration']),
  },
  {
    title: 'Club de Débat',
    description: 'Séance de débat sur le thème : "La technologie rend-elle l\'éducation plus égale ?".',
    category: 'Club',
    startDateTime: '2026-06-11T18:00:00.000Z',
    endDateTime: '2026-06-11T20:00:00.000Z',
    locationName: 'Salle 105',
    organizerName: 'Club Débat',
    capacity: 35,
    registeredCount: 28,
    tags: JSON.stringify(['débat', 'éducation', 'technologie']),
  },
  {
    title: 'Examen Base de Données',
    description: 'Examen final du module BD : SQL, normalisation et optimisation.',
    category: 'Exam',
    startDateTime: '2026-06-13T08:30:00.000Z',
    endDateTime: '2026-06-13T10:30:00.000Z',
    locationName: 'Salle 205',
    organizerName: 'Département Informatique',
    capacity: 55,
    registeredCount: 55,
    tags: JSON.stringify(['examen', 'BDD', 'SQL', 'L3']),
  },
  {
    title: 'Conférence Cybersécurité',
    description: 'Les métiers de la cybersécurité et les menaces actuelles : ransomware, phishing, zero-day.',
    category: 'Talk',
    startDateTime: '2026-06-15T10:00:00.000Z',
    endDateTime: '2026-06-15T12:00:00.000Z',
    locationName: 'Amphi A',
    organizerName: 'Club Cyber',
    capacity: 150,
    registeredCount: 62,
    tags: JSON.stringify(['cybersécurité', 'ransomware', 'phishing', 'carrière']),
  },
  {
    title: 'Atelier Docker & Kubernetes',
    description: 'Introduction pratique à la conteneurisation avec Docker et orchestration Kubernetes.',
    category: 'Workshop',
    startDateTime: '2026-06-17T14:00:00.000Z',
    endDateTime: '2026-06-17T17:00:00.000Z',
    locationName: 'Labo Informatique',
    organizerName: 'Professeur Martin',
    capacity: 20,
    registeredCount: 7,
    tags: JSON.stringify(['Docker', 'Kubernetes', 'conteneurisation', 'DevOps']),
  },
  {
    title: 'Sortie Culturelle : Musée des Sciences',
    description: 'Visite guidée du musée des sciences avec ateliers interactifs ouverts à tous.',
    category: 'Other',
    startDateTime: '2026-06-19T09:00:00.000Z',
    endDateTime: '2026-06-19T16:00:00.000Z',
    locationName: 'Musée des Sciences',
    organizerName: 'Bureau des Étudiants',
    capacity: 50,
    registeredCount: 18,
    tags: JSON.stringify(['culture', 'musée', 'sortie', 'sciences']),
  },
]

export function addExtraEvents() {
  const db = getDb()
  const insert = db.prepareSync(
    `INSERT OR IGNORE INTO events (id, title, description, category, startDateTime, endDateTime, locationName, organizerName, capacity, registeredCount, imageUrl, tags, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const now = new Date().toISOString()
  for (const ev of MORE_EVENTS) {
    const exists = db.getFirstSync('SELECT 1 FROM events WHERE title = ?', [ev.title])
    if (!exists) {
      insert.executeSync(
        uuid(), ev.title, ev.description, ev.category,
        ev.startDateTime, ev.endDateTime,
        ev.locationName, ev.organizerName, ev.capacity, ev.registeredCount || 0, null, ev.tags, now
      )
    }
  }
}

const ALL_SEED = [
  ...SAMPLE_EVENTS,
  { title: 'Test Inscription Rapid', registeredCount: 0 },
  { title: 'Conference Complet', registeredCount: 50 },
  { title: 'Hackathon Cybersécurité', registeredCount: 25 },
  { title: 'Introduction au Web Development', registeredCount: 55 },
  { title: 'Cours d\'Anglais Technique', registeredCount: 30 },
  ...MORE_EVENTS,
]

export function updateRegisteredCounts() {
  const db = getDb()
  const byTitle = {}
  for (const ev of ALL_SEED) {
    if (ev.registeredCount !== undefined && ev.registeredCount > 0) {
      byTitle[ev.title] = ev.registeredCount
    }
  }
  for (const [title, count] of Object.entries(byTitle)) {
    db.runSync('UPDATE events SET registeredCount = ? WHERE title = ? AND registeredCount = 0', [count, title])
  }
}

export function seedIfEmpty() {
  const db = getDb()

  const hasPastEvents = db.getFirstSync(
    "SELECT 1 FROM events WHERE title = 'Hackathon Cybersécurité'"
  )
  if (hasPastEvents) return

  db.execSync('DELETE FROM events; DELETE FROM favorites; DELETE FROM registrations; DELETE FROM llm_results')

  const now = new Date().toISOString()
  const tomorrow = new Date(Date.now() + 86400000).toISOString()
  const insert = db.prepareSync(
    `INSERT INTO events (id, title, description, category, startDateTime, endDateTime, locationName, organizerName, capacity, registeredCount, imageUrl, tags, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const allEvents = [
    ...SAMPLE_EVENTS,
    {
      title: 'Test Inscription Rapid',
      description: 'Événement test pour vérifier l\'inscription. Il commence demain.',
      category: 'Other',
      startDateTime: tomorrow,
      endDateTime: null,
      locationName: 'Salle Test 101',
      organizerName: 'Admin',
      capacity: 10,
      tags: JSON.stringify(['test']),
    },
    {
      title: 'Conference Complet',
      description: 'Cet événement a déjà atteint sa capacité maximale. Il est complet.',
      category: 'Talk',
      startDateTime: tomorrow,
      endDateTime: null,
      locationName: 'Grand Amphi',
      organizerName: 'Dr. Benali',
      capacity: 50,
      registeredCount: 50,
      tags: JSON.stringify(['test', 'complet']),
    },
    {
      title: 'Hackathon Cybersécurité',
      description: 'Atelier pratique sur les techniques de pentesting et la sécurisation des réseaux.',
      category: 'Workshop',
      startDateTime: '2026-05-15T09:00:00.000Z',
      endDateTime: '2026-05-15T17:00:00.000Z',
      locationName: 'Labo Sécurité',
      organizerName: 'Club Cyber',
      capacity: 25,
      tags: JSON.stringify(['cybersécurité', 'pentest', 'réseaux']),
    },
    {
      title: 'Introduction au Web Development',
      description: 'Les fondamentaux du développement web : HTML, CSS, JavaScript et React.',
      category: 'Talk',
      startDateTime: '2026-05-10T14:00:00.000Z',
      endDateTime: '2026-05-10T16:00:00.000Z',
      locationName: 'Amphi B',
      organizerName: 'Professeur Martin',
      capacity: 80,
      tags: JSON.stringify(['web', 'HTML', 'CSS', 'JavaScript', 'React']),
    },
    {
      title: 'Cours d\'Anglais Technique',
      description: 'Renforcez votre anglais pour le milieu professionnel et technique.',
      category: 'Club',
      startDateTime: '2026-05-20T10:00:00.000Z',
      endDateTime: '2026-05-20T12:00:00.000Z',
      locationName: 'Salle 105',
      organizerName: 'Département Langues',
      capacity: 30,
      tags: JSON.stringify(['anglais', 'technique', 'langues']),
    },
  ]

  for (const ev of allEvents) {
    insert.executeSync(
      uuid(), ev.title, ev.description, ev.category,
      ev.startDateTime, ev.endDateTime,
      ev.locationName, ev.organizerName, ev.capacity, ev.registeredCount || 0, null, ev.tags, now
    )
  }
}
