# 🏫 CampusEventsIA

> **Agenda universitaire intelligent** — Gérez vos événements, inscriptions et favoris, le tout propulsé par un assistant IA.

<p align="center">
  <img src="images/pagedelogin.jpeg" alt="Page de connexion" width="180"/>
</p>

![Expo SDK](https://img.shields.io/badge/Expo_SDK-54-000020?logo=expo)
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?logo=react)
![Express](https://img.shields.io/badge/Backend-Express.js-000000?logo=express)
![SQLite](https://img.shields.io/badge/DB-expo--sqlite-003B57?logo=sqlite)
![Platform](https://img.shields.io/badge/platform-iOS_|_Android-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table des matières

- [Contexte & Problème](#-contexte--problème)
- [Fonctionnalités](#-fonctionnalités)
- [Stack technique](#-stack-technique)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Comptes de démo](#-comptes-de-démo)
- [Guide de test](#-guide-de-test)
- [API Backend](#-api-backend)
- [Structure du projet](#-structure-du-projet)
- [Dépannage](#-dépannage)

---

## 🎯 Contexte & Problème

Les étudiants et administrateurs universitaires jonglent avec de multiples sources d'information : 

| Problème | Solution CampusEventsIA |
|----------|------------------------|
| 📍 Événements dispersés (mails, affichages, réseaux sociaux) | **Catalogue centralisé** dans une app mobile unique |
| ❌ Inscriptions sans suivi | **Système d'inscription** avec compteur de places et notifications |
| 🔍 Recherche manuelle fastidieuse | **Assistant IA** qui comprend le langage naturel |
| 📊 Aucune recommandation personnalisée | **Profil étudiant** + recommandations IA sur mesure |

### 👥 Deux rôles

| Rôle | Périmètre |
|------|-----------|
| **🛠️ Admin** | Crée, modifie, supprime et exporte les événements |
| **🎓 Étudiant** | Parcourt, cherche, s'inscrit, reçoit des recommandations IA |

---

## ✨ Fonctionnalités

### 🛠️ Administration
| Fonction | Détail |
|----------|--------|
| ➕ Création d'événements | Titre, description, catégorie, date, capacité, tags |
| ✏️ Modification | Édition de tous les champs |
| 🗑️ Suppression | Avec cascade sur inscriptions et favoris |
| 📤 Export JSON | Partage du catalogue via `expo-sharing` |
| 🗂️ Catégories | `Talk` · `Workshop` · `Club` · `Exam` · `Other` |

### 🎓 Étudiant — 4 onglets

| # | Onglet | Fonction |
|---|--------|----------|
| 1 | 📅 **Événements** | Catalogue complet avec recherche et filtres |
| 2 | ❤️ **Favoris** | Marquer/retirer des événements |
| 3 | ✅ **Inscriptions** | S'inscrire, se désister, compteur temps réel |
| 4 | 🤖 **Assistant IA** | 6 modes d'intelligence artificielle |

### 🤖 Assistant IA — 6 modes

| Mode | Icône | Action |
|------|-------|--------|
| **Recherche** | 🔍 | Cherche des événements en langage naturel |
| **Recommandations** | ⭐ | 3 suggestions personnalisées selon ton profil |
| **Comparer** | ↔️ | Compare 2 événements et recommande le meilleur |
| **Planning** | 📅 | Planifie ta semaine selon tes contraintes |
| **Résumé** | 📰 | Résumé automatique des événements de la semaine |
| **Questions** | ❓ | Pose une question sur le catalogue |

> 💡 Les modes **Recommandations** et **Comparer** utilisent le profil étudiant (filière, année, centres d'intérêt).

### 🔔 Notifications
- **Rappel automatique** 2h avant chaque événement (`expo-notifications`)
- **Annulation** automatique de la notification en cas de désistement

---

## 🧱 Stack technique

| Couche | Technologie |
|--------|-------------|
| 📱 **Mobile** | React Native (Expo SDK 54) |
| 🗄️ **Base de données** | `expo-sqlite` (synchrone, 100% locale) |
| 🧭 **Navigation** | `@react-navigation/native-stack` |
| 🧠 **IA** | OpenAI GPT / Groq (via proxy backend) |
| 🖥️ **Backend** | Express.js (proxy IA uniquement) |
| 🔐 **Auth** | Simulée côté frontend (credentials en dur) |

> 🔒 **100% local** : auth, événements, favoris, inscriptions — tout est stocké dans SQLite.  
> Le backend sert uniquement de proxy pour protéger la clé API d'IA.

---

## 🏗️ Architecture

```
                         WiFi (même réseau)
┌─────────────────────────┐               ┌──────────────┐
│  💻 PC (serveur)        │ ◄───────────► │  📱 Téléphone │
│                         │               │              │
│  Backend (Express):3000  │               │  Expo Go     │
│  Expo bundler    :8081  │               │  scan QR code│
│  IP : 192.168.1.XX      │               │              │
└─────────────────────────┘               └──────────────┘
```

---

## 🔧 Installation

### ✅ Prérequis

| Outil | Version |
|-------|---------|
| **Node.js** | ≥ 20.19 |
| **npm** | ≥ 9 |
| **Expo Go** | Dernière version (iOS ou Android) |
| **Réseau** | PC et téléphone sur le même WiFi |

### 📦 1. Backend (obligatoire seulement pour le chat IA)

```bash
cd backend
npm install
npm start
```

Vérifie que le serveur répond :

```bash
curl http://localhost:3000/api/health
# → {"status":"ok","service":"CampusEventsIA Backend"}
```

### 📱 2. Frontend

```bash
cd frontend
npm install
npx expo start
```

- Un QR code s'affiche dans le terminal
- Scanne-le avec **Expo Go** sur ton téléphone

---

## ⚙️ Configuration

### Backend — `backend/.env`

```env
PORT=3000
OPENAI_API_KEY=sk-...    # Ta clé OpenAI (optionnel sans chat IA)
```

### Frontend — URL de l'API

Trouve ton IP locale (carte WiFi active) :

```powershell
ipconfig
# Adresse IPv4 : 192.168.1.XX
```

Modifie `frontend/src/services/api.js` :

```js
const API_URL = 'http://192.168.1.XX:3000/api';
```

> ⚠️ L'URL doit correspondre à l'IP de ton PC sur le réseau WiFi.

---

## 👥 Comptes de démo

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| 🛠️ **Admin** | `admin@campus.ma` | `admin123` |
| 🎓 **Étudiant** | `etudiant@campus.ma` | `etudiant123` |

> ⚠️ L'authentification est simulée côté frontend (credentials en dur dans le code).

---

## 🧪 Guide de test

### 1️⃣ Test flux Admin

| Étape | Action |
|-------|--------|
| 🔑 | Connecte-toi avec `admin@campus.ma` / `admin123` |
| ➕ | Bouton "+" → remplis le formulaire (titre, catégorie, date, capacité, tags) |
| ✏️ | Tape sur un événement → **Modifier** |
| 🗑️ | Tape sur un événement → **Supprimer** |
| 📤 | Icône ⬇️ dans l'en-tête → partage le catalogue en JSON |

### 2️⃣ Test flux Étudiant

| Étape | Action |
|-------|--------|
| 🔑 | Connecte-toi avec `etudiant@campus.ma` / `etudiant123` |
| 📅 | **Onglet "Événements"** — catalogue complet avec barre de recherche |
| ❤️ | Tape sur un cœur pour ajouter/retirer des **favoris** |
| 📋 | Tape sur un événement → détail, partage, fav, inscription |
| ✅ | **S'inscrire** → compteur mis à jour, notification programmée |
| ❌ | **Se désister** → notification annulée |
| 📑 | **Onglet "Inscriptions"** — liste de tes inscriptions |
| 👤 | Bouton 👤 en haut → édite ton **profil** (filière, année, centres d'intérêt) |

### 3️⃣ Test Assistant IA (6 modes)

> 🧠 Nécessite le backend + une clé API IA valide.

Passe d'un mode à l'autre avec les sous-onglets en haut du chat :

| # | Mode | Comment tester |
|---|------|---------------|
| 1 | 🔍 **Recherche** | Tape `"atelier Python"` → l'IA filtre les événements |
| 2 | ⭐ **Recommandations** | Appuie sur **Lancer** → 3 suggestions personnalisées |
| 3 | ↔️ **Comparer** | Tape `"compare Hackathon et Workshop ML"` → analyse + reco |
| 4 | 📅 **Planning** | Tape `"j'ai cours lundi et mercredi matin"` → planning suggéré |
| 5 | 📰 **Résumé** | Appuie sur **Lancer** → résumé de la semaine (cache 5 min) |
| 6 | ❓ **Questions** | Demande `"Combien d'événements ce mois-ci ?"` |

### 4️⃣ Test Notifications

1. S'inscris à un événement avec un horaire proche
2. Une notification locale est programmée **2h avant** le début
3. Désinscris-toi → la notification est annulée

### 5️⃣ Reset DB

Pour repartir de zéro :

```powershell
npx expo start --clear
# Puis désinstaller/réinstaller l'app via Expo Go
```

---

## 🌐 API Backend

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/health` | Healthcheck du serveur |
| `POST` | `/api/chat` | Proxy OpenAI (reçoit `systemPrompt` + `userMessage`) |

> Toutes les données métier (événements, favoris, inscriptions) sont gérées **localement** via `expo-sqlite` — pas de backend nécessaire.

---

## 📁 Structure du projet

```
CampusEventsIA/
├── backend/                  # Serveur Express
│   ├── server.js             # Point d'entrée (port 3000)
│   ├── routes/chat.js        # Proxy OpenAI
│   └── .env                  # Variables d'environnement
│
├── frontend/                 # App React Native / Expo
│   ├── App.js                # Point d'entrée (init DB + seed)
│   └── src/
│       ├── database/         # Couche données (SQLite)
│       │   ├── init.js       # Création des tables
│       │   ├── events.js     # CRUD événements
│       │   ├── favorites.js  # CRUD favoris
│       │   ├── registrations.js  # Inscriptions + notifs
│       │   ├── profile.js    # Profil étudiant
│       │   ├── llmResults.js # Cache des résultats IA
│       │   └── seed.js       # Données de démo
│       │
│       ├── screens/          # Écrans
│       │   ├── LoginScreen.js
│       │   ├── AdminScreen.js
│       │   ├── StudentScreen.js   # 4 onglets
│       │   ├── ChatScreen.js      # 6 modes IA
│       │   └── ProfileScreen.js
│       │
│       ├── components/       # Composants réutilisables
│       │   ├── EventCard.js
│       │   ├── EventDetail.js
│       │   └── EventForm.js
│       │
│       ├── context/
│       │   └── AuthContext.js
│       │
│       ├── navigation/
│       │   └── AppNavigator.js
│       │
│       └── services/
│           ├── api.js        # Client HTTP → backend
│           └── llm.js        # Construction des prompts IA
```

---

## 🛠️ Dépannage

| Problème | Solution |
|----------|----------|
| 📷 QR code ne marche pas | `npx expo start --tunnel` (passe par internet, plus lent) |
| 🌐 "Network error" dans l'app | Vérifie que le backend tourne et que l'IP dans `api.js` est correcte |
| 🔥 Pare-feu bloque la connexion | Ajoute une règle entrante pour les ports **3000** et **8081** |
| 📡 WiFi différents | Les deux appareils doivent être sur le **même** réseau |
| 🌀 L'app freeze au chargement | `npx expo start --clear` pour vider le cache |
| 🔄 Les données seed ne s'ajoutent pas | Désinstalle/réinstalle l'app via Expo Go |

---

<div align="center">
  <br/>
  <p>
    <strong>CampusEventsIA</strong> — <em>Agenda universitaire intelligent</em>
  </p>
  <p>
    🎓 Fait avec ❤️ pour les étudiants et administrateurs
  </p>
</div>
