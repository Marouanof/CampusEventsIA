import { api } from './api'

const MAX_CONTEXT_CHARS = 6000
const MODEL = 'llama-3.3-70b-versatile'
const MAX_TOKENS = 800
const TEMPERATURE = 0.3

/**
 * Supprime les champs inutiles avant envoi au LLM.
 * Ne jamais envoyer : id, createdAt, imageUrl, locationAddress
 */
export function sanitizeEvents(events) {
  if (!events) return []
  return events.map(({ title, description, category, startDateTime, endDateTime, locationName, capacity, registeredCount, tags }) => ({
    title, description, category, startDateTime, endDateTime, locationName,
    capacity, registeredCount, tags
  }))
}

/**
 * Formate les événements en JSON compact pour le prompt.
 */
function formatEventsJSON(events) {
  return JSON.stringify(events, null, 2)
}

/**
 * Tronque le contexte événementiel si trop long.
 * On garde les N premiers événements qui tiennent dans MAX_CONTEXT_CHARS.
 */
export function limitContext(eventsJson, maxChars = MAX_CONTEXT_CHARS) {
  if (eventsJson.length <= maxChars) return eventsJson
  const lines = eventsJson.split('\n')
  let result = ''
  for (const line of lines) {
    if ((result + line + '\n').length > maxChars) {
      result += '\n  // ... tronqué'
      break
    }
    result += line + '\n'
  }
  return result
}

/**
 * Prompt nommé : Recherche en langage naturel
 *
 * Rôle système : Assistant de recherche sémantique
 * Données : Catalogue complet en JSON
 * Sortie : Titre + justification pour chaque correspondance
 * Limite : 6000 caractères de contexte
 */
function buildSearchPrompt(eventsJSON) {
  return `Tu es l'assistant de recherche sémantique de CampusEvents.
Tu reçois le catalogue complet des événements au format JSON.
L'utilisateur exprime son besoin en langage naturel, sans connaître les mots-clés exacts.

Règles :
- Identifie les événements pertinents selon le sens de la requête, pas seulement les mots exacts
- Pour chaque événement sélectionné, retourne : le titre, la date, et une justification courte (pourquoi il correspond)
- Si rien ne correspond, réponds clairement "Aucun événement trouvé pour cette recherche"
- Réponds en français

Format de sortie attendu :
**Titre de l'événement** (date) — Justification

Catalogue des événements (JSON) :
${eventsJSON}`
}

/**
 * Prompt nommé : Recommandation personnalisée
 *
 * Rôle système : Assistant de recommandation
 * Données : Historique étudiant (favoris + inscriptions) + événements à venir en JSON
 * Sortie : 3 suggestions avec justification personnalisée
 * Limite : 6000 caractères de contexte
 */
function buildRecommendationPrompt(eventsJSON, userContext) {
  return `Tu es l'assistant de recommandation personnalisée de CampusEvents.
Tu analyses les goûts de l'étudiant à partir de son historique et suggères des événements pertinents.

Règles :
- Suggère exactement 3 événements à venir que l'étudiant n'a pas encore consultés
- Chaque suggestion doit être personnalisée selon les goûts détectés
- Justifie chaque recommandation en 1-2 phrases
- Si l'historique est vide, base-toi sur les événements les plus populaires ou variés
- Réponds en français

Format de sortie attendu :
1. **Titre** (date) — Justification personnalisée
2. **Titre** (date) — Justification personnalisée
3. **Titre** (date) — Justification personnalisée

Historique de l'étudiant (favoris et inscriptions) :
${userContext || 'Aucun historique disponible.'}

Catalogue des événements à venir (JSON) :
${eventsJSON}`
}

/**
 * Prompt nommé : Assistant de planification
 *
 * Rôle système : Assistant de planification hebdomadaire
 * Données : Événements de la semaine en JSON
 * Sortie : Planning jour par jour sans conflit
 * Limite : 6000 caractères de contexte
 */
function buildPlanningPrompt(eventsJSON) {
  return `Tu es l'assistant de planification hebdomadaire de CampusEvents.
L'étudiant décrit ses contraintes horaires en langage naturel.
Tu produis un planning de participation suggéré sans conflit horaire.

Règles :
- Planifie jour par jour (lundi à dimanche)
- Évite les conflits horaires (deux événements à la même heure)
- Ignore les événements passés
- Si un créneau est occupé par les cours de l'étudiant, ne propose rien
- Réponds en français, de manière structurée

Format de sortie attendu :
**Lundi JJ/MM**
- HH:MM – HH:MM : Titre (Lieu)
- (libre)

**Mardi JJ/MM**
...

Événements de la semaine (JSON) :
${eventsJSON}`
}

/**
 * Prompt nommé : Questions / Réponses sur le catalogue
 *
 * Rôle système : Assistant de connaissance du catalogue
 * Données : Catalogue complet en JSON
 * Sortie : Réponse précise basée uniquement sur les données
 * Limite : 6000 caractères de contexte
 */
/**
 * Prompt nommé : Comparaison d'événements
 *
 * Rôle système : Assistant de comparaison
 * Données : Deux événements spécifiques + profil étudiant
 * Sortie : Analyse comparative avec recommandation
 * Limite : 6000 caractères de contexte
 */
function buildComparisonPrompt(eventsJSON, userContext) {
  return `Tu es l'assistant de comparaison de CampusEvents.
Tu reçois deux événements et le profil de l'étudiant.
Tu compares les deux événements et recommandes celui qui correspond le mieux.

Règles :
- Analyse les deux événements sous tous les angles : contenu, date, durée, capacité
- Prends en compte le profil et les centres d'intérêt de l'étudiant
- Conclus par une recommandation claire : "Recommandation : [titre]"
- Réponds en français

Profil de l'étudiant :
${userContext || 'Non renseigné.'}

Événements à comparer (JSON) :
${eventsJSON}`
}

/**
 * Prompt nommé : Résumé hebdomadaire
 *
 * Rôle système : Assistant de digest hebdo
 * Données : Événements de la semaine en JSON
 * Sortie : Résumé structuré "Cette semaine sur le campus..."
 * Limite : 6000 caractères de contexte
 */
function buildWeeklyPrompt(eventsJSON) {
  return `Tu es l'assistant de résumé hebdomadaire de CampusEvents.
Tu produis un digest automatique des événements de la semaine sur le campus.

Règles :
- Commence par "Cette semaine sur le campus..."
- Résume les événements marquants par catégorie (Talk, Workshop, Club, Exam, Other)
- Mentionne les dates et lieux clés
- Mets en avant les événements avec places disponibles
- Si la semaine est vide, dis-le simplement
- Réponds en français, ton amical et dynamique

Format de sortie attendu :
Cette semaine sur le campus...
📅 **Lundi JJ/MM** — [résumé]
📅 **Mardi JJ/MM** — [résumé]
...

Événements de la semaine (JSON) :
${eventsJSON}`
}

function buildQAPrompt(eventsJSON) {
  return `Tu es l'assistant de connaissance du catalogue de CampusEvents.
Tu réponds aux questions sur l'ensemble des événements universitaires.

Règles :
- Réponds UNIQUEMENT à partir des événements listés ci-dessous
- Si l'information n'est pas dans le catalogue, réponds "Je n'ai pas cette information dans le catalogue actuel"
- Cite les événements pertinents avec leur date
- Réponds en français

Format de sortie attendu :
Réponse concise, puis liste des événements concernés avec titre et date.

Catalogue des événements (JSON) :
${eventsJSON}`
}

const NO_INPUT_MODES = ['recommendation', 'weekly']

const PROMPT_BUILDERS = {
  search: buildSearchPrompt,
  recommendation: buildRecommendationPrompt,
  planning: buildPlanningPrompt,
  comparison: buildComparisonPrompt,
  weekly: buildWeeklyPrompt,
  qa: buildQAPrompt,
}

/**
 * Point d'entrée unique pour tous les appels LLM.
 *
 * @param {string} mode — 'search' | 'recommendation' | 'planning' | 'comparison' | 'weekly' | 'qa'
 * @param {Array} events — événements depuis SQLite
 * @param {string} userInput — message ou contrainte de l'utilisateur
 * @param {string} [userContext] — profil + historique pour personnalisation
 * @returns {Promise<string>} — réponse texte du LLM
 */
export async function sendToLLM(mode, events, userInput, userContext) {
  const sanitized = sanitizeEvents(events)
  let json = formatEventsJSON(sanitized)
  json = limitContext(json, MAX_CONTEXT_CHARS)

  const builder = PROMPT_BUILDERS[mode]
  if (!builder) throw new Error(`Mode LLM inconnu : ${mode}`)

  const systemPrompt = builder(json, userContext)

  const userMessage = NO_INPUT_MODES.includes(mode) && !userInput?.trim()
    ? mode === 'recommendation' ? 'Recommande-moi 3 événements.' : 'Résume ma semaine.'
    : userInput

  const data = await api.sendLlmRequest(systemPrompt, userMessage, { model: MODEL, max_tokens: MAX_TOKENS, temperature: TEMPERATURE })
  return data.response
}
