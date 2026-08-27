import { getDb } from './init'
import { uuid } from '../utils'

function daysFromNow(n, h = 9, m = 0) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

function daysAgo(n, h = 10, m = 0) {
  return daysFromNow(-n, h, m)
}

const SAMPLE_EVENTS = [
  {
    title: 'Conférence IA & Éthique',
    description: 'Les enjeux moraux de l\'intelligence artificielle dans l\'éducation et la santé.',
    category: 'Talk',
    startDateTime: daysAgo(5, 10, 0),
    endDateTime: daysAgo(5, 12, 0),
    locationName: 'Grand Amphi',
    organizerName: 'Dr. Benali',
    capacity: 150,
    registeredCount: 88,
    tags: JSON.stringify(['IA', 'éthique', 'conférence']),
  },
  {
    title: 'Atelier React Native',
    description: 'Atelier pratique pour construire une app mobile cross-platform avec React Native et Expo.',
    category: 'Workshop',
    startDateTime: daysAgo(3, 14, 0),
    endDateTime: daysAgo(3, 17, 0),
    locationName: 'Salle TP 3',
    organizerName: 'Professeur Martin',
    capacity: 30,
    registeredCount: 22,
    tags: JSON.stringify(['React Native', 'mobile', 'workshop']),
  },
  {
    title: 'Examen Algèbre Linéaire',
    description: 'Examen final du module d\'algèbre linéaire — durée 3h.',
    category: 'Exam',
    startDateTime: daysAgo(1, 8, 30),
    endDateTime: daysAgo(1, 11, 30),
    locationName: 'Salle 201',
    organizerName: 'Département Maths',
    capacity: 60,
    registeredCount: 60,
    tags: JSON.stringify(['examen', 'algèbre', 'L2']),
  },
  {
    title: 'Club de Robotique',
    description: 'Réunion hebdomadaire du club de robotique — présentation du nouveau robot.',
    category: 'Club',
    startDateTime: daysAgo(2, 18, 0),
    endDateTime: null,
    locationName: 'Labo Informatique',
    organizerName: 'Club Robotique',
    capacity: 20,
    registeredCount: 20,
    tags: JSON.stringify(['robotique', 'club', 'pratique']),
  },
  {
    title: 'Introduction au Machine Learning',
    description: 'Découvrez les bases du machine learning avec des exemples pratiques en Python.',
    category: 'Talk',
    startDateTime: daysFromNow(1, 9, 0),
    endDateTime: daysFromNow(1, 11, 0),
    locationName: 'Amphi A',
    organizerName: 'Dr. Benali',
    capacity: 100,
    registeredCount: 42,
    tags: JSON.stringify(['IA', 'machine learning', 'débutant']),
  },
  {
    title: 'Atelier Python Data Science',
    description: 'Manipulation de données avec Pandas, NumPy et visualisation Matplotlib.',
    category: 'Workshop',
    startDateTime: daysFromNow(2, 14, 0),
    endDateTime: daysFromNow(2, 17, 0),
    locationName: 'Salle TP 1',
    organizerName: 'Professeur Karim',
    capacity: 25,
    registeredCount: 19,
    tags: JSON.stringify(['Python', 'Data Science', 'Pandas']),
  },
  {
    title: 'Club de Théâtre',
    description: 'Atelier d\'improvisation et répétition pour le spectacle de rentrée.',
    category: 'Club',
    startDateTime: daysFromNow(3, 17, 0),
    endDateTime: daysFromNow(3, 19, 0),
    locationName: 'Salle Polyvalente',
    organizerName: 'Club Théâtre',
    capacity: 40,
    registeredCount: 14,
    tags: JSON.stringify(['théâtre', 'improvisation', 'culture']),
  },
  {
    title: 'Examen POO Java',
    description: 'Examen final du module Programmation Orientée Objet en Java — durée 2h.',
    category: 'Exam',
    startDateTime: daysFromNow(5, 8, 30),
    endDateTime: daysFromNow(5, 10, 30),
    locationName: 'Salle 203',
    organizerName: 'Département Informatique',
    capacity: 50,
    registeredCount: 47,
    tags: JSON.stringify(['examen', 'POO', 'Java', 'L2']),
  },
  {
    title: 'Séminaire IA Générative',
    description: 'ChatGPT, DALL-E, Midjourney — l\'impact de l\'IA générative sur le monde professionnel.',
    category: 'Talk',
    startDateTime: daysFromNow(4, 10, 0),
    endDateTime: daysFromNow(4, 12, 0),
    locationName: 'Grand Amphi',
    organizerName: 'Dr. Benali',
    capacity: 200,
    registeredCount: 112,
    tags: JSON.stringify(['IA', 'ChatGPT', 'générative', 'GPT']),
  },
  {
    title: 'Atelier Git & GitHub',
    description: 'Branches, commits, pull requests et collaboration en équipe.',
    category: 'Workshop',
    startDateTime: daysFromNow(6, 14, 0),
    endDateTime: daysFromNow(6, 16, 0),
    locationName: 'Salle TP 2',
    organizerName: 'Club Dev',
    capacity: 30,
    registeredCount: 24,
    tags: JSON.stringify(['Git', 'GitHub', 'versioning', 'collaboration']),
  },
  {
    title: 'Hackathon Innovation',
    description: '48h pour créer un projet innovant en équipe — prix et opportunities de stage.',
    category: 'Other',
    startDateTime: daysFromNow(8, 9, 0),
    endDateTime: daysFromNow(10, 9, 0),
    locationName: 'Espace Innovation',
    organizerName: 'Bureau des Étudiants',
    capacity: 80,
    registeredCount: 53,
    tags: JSON.stringify(['hackathon', 'innovation', 'compétition']),
  },
  {
    title: 'Club de Débat',
    description: '"La technologie rend-elle l\'éducation plus égale ?" — débat ouvert à tous.',
    category: 'Club',
    startDateTime: daysFromNow(7, 18, 0),
    endDateTime: daysFromNow(7, 20, 0),
    locationName: 'Salle 105',
    organizerName: 'Club Débat',
    capacity: 35,
    registeredCount: 21,
    tags: JSON.stringify(['débat', 'éducation', 'technologie']),
  },
  {
    title: 'Examen Base de Données',
    description: 'SQL, normalisation, optimisation — examen final du module BD.',
    category: 'Exam',
    startDateTime: daysFromNow(12, 8, 30),
    endDateTime: daysFromNow(12, 10, 30),
    locationName: 'Salle 205',
    organizerName: 'Département Informatique',
    capacity: 55,
    registeredCount: 38,
    tags: JSON.stringify(['examen', 'BDD', 'SQL', 'L3']),
  },
  {
    title: 'Conférence Cybersécurité',
    description: 'Ransomware, phishing, zero-day — les métiers et menaces de la cybersécurité.',
    category: 'Talk',
    startDateTime: daysFromNow(9, 10, 0),
    endDateTime: daysFromNow(9, 12, 0),
    locationName: 'Amphi A',
    organizerName: 'Club Cyber',
    capacity: 150,
    registeredCount: 67,
    tags: JSON.stringify(['cybersécurité', 'ransomware', 'phishing', 'carrière']),
  },
  {
    title: 'Atelier Docker & Kubernetes',
    description: 'Conteneurisation avec Docker et orchestration Kubernetes — TP complet.',
    category: 'Workshop',
    startDateTime: daysFromNow(11, 14, 0),
    endDateTime: daysFromNow(11, 17, 0),
    locationName: 'Labo Informatique',
    organizerName: 'Professeur Martin',
    capacity: 20,
    registeredCount: 13,
    tags: JSON.stringify(['Docker', 'Kubernetes', 'conteneurisation', 'DevOps']),
  },
  {
    title: 'Sortie Musée des Sciences',
    description: 'Visite guidée avec ateliers interactifs — ouvert à tous les étudiants.',
    category: 'Other',
    startDateTime: daysFromNow(14, 9, 0),
    endDateTime: daysFromNow(14, 16, 0),
    locationName: 'Musée des Sciences',
    organizerName: 'Bureau des Étudiants',
    capacity: 50,
    registeredCount: 22,
    tags: JSON.stringify(['culture', 'musée', 'sortie', 'sciences']),
  },
  {
    title: 'Atelier Flutter',
    description: 'Créez votre première app mobile avec Flutter et Dart — niveau débutant.',
    category: 'Workshop',
    startDateTime: daysFromNow(15, 14, 0),
    endDateTime: daysFromNow(15, 17, 0),
    locationName: 'Salle TP 4',
    organizerName: 'Professeur Karim',
    capacity: 25,
    registeredCount: 8,
    tags: JSON.stringify(['Flutter', 'Dart', 'mobile', 'workshop']),
  },
  {
    title: 'Club Photo',
    description: 'Sortie photo urbaine et atelier post-traitement Lightroom.',
    category: 'Club',
    startDateTime: daysFromNow(10, 15, 0),
    endDateTime: daysFromNow(10, 18, 0),
    locationName: 'Entrée Bâtiment A',
    organizerName: 'Club Photo',
    capacity: 15,
    registeredCount: 11,
    tags: JSON.stringify(['photo', 'club', 'créatif']),
  },
  {
    title: 'Conférence Cloud Computing',
    description: 'AWS, Azure, GCP — les fondamentaux du cloud et bonnes pratiques DevOps.',
    category: 'Talk',
    startDateTime: daysAgo(7, 10, 0),
    endDateTime: daysAgo(7, 12, 0),
    locationName: 'Amphi C',
    organizerName: 'Dr. El Amrani',
    capacity: 120,
    registeredCount: 51,
    tags: JSON.stringify(['cloud', 'AWS', 'Azure', 'DevOps']),
  },
]

export function seedIfEmpty() {
  const db = getDb()

  const hasOldEvents = db.getFirstSync("SELECT 1 FROM events WHERE title = 'Hackathon Cybersécurité' OR title = 'Test Inscription Rapid' OR title = 'Introduction au Web Development'")
  if (!hasOldEvents) {
    const eventCount = db.getFirstSync('SELECT COUNT(*) as c FROM events')
    if (eventCount && eventCount.c > 0) return
  }

  db.execSync('DELETE FROM events; DELETE FROM favorites; DELETE FROM registrations; DELETE FROM llm_results')

  const now = new Date().toISOString()
  const insert = db.prepareSync(
    `INSERT INTO events (id, title, description, category, startDateTime, endDateTime, locationName, organizerName, capacity, registeredCount, imageUrl, tags, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  for (const ev of SAMPLE_EVENTS) {
    insert.executeSync(
      uuid(), ev.title, ev.description, ev.category,
      ev.startDateTime, ev.endDateTime,
      ev.locationName, ev.organizerName, ev.capacity, ev.registeredCount || 0, null, ev.tags, now
    )
  }
}
