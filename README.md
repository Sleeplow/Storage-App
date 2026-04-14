# StorageApp

Application web progressive (PWA) pour gérer l'inventaire de boîtes de rangement en famille.

**Stack :** React 19 + Vite 8 + Firebase (Auth, Firestore) + Cloudinary + Vercel

---

## Démarrage local

### 1. Cloner le projet

```bash
git clone https://github.com/sleeplow/storage-app.git
cd storage-app
npm install
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine :

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...
```

> Trouvez ces valeurs dans : Firebase Console → Paramètres du projet → Vos applications

### 3. Lancer le serveur de développement

```bash
npm run dev
```

L'app est accessible sur **http://localhost:5173**

---

## Déploiement sur Vercel

### Prérequis
- Compte [Vercel](https://vercel.com) (gratuit)
- Dépôt GitHub connecté à Vercel

### Étapes

1. **Connectez votre repo GitHub** sur vercel.com → New Project → Import

2. **Configurez les variables d'environnement** dans Vercel :
   - Settings → Environment Variables
   - Ajoutez chacune des 8 variables du `.env.local`

3. **Déployez** — Vercel détecte automatiquement Vite et configure le build :
   - Build Command : `npm run build`
   - Output Directory : `dist`

4. Le `vercel.json` inclus gère le routing SPA (toutes les routes → `index.html`).

### Déploiement automatique
Chaque `git push` sur `main` déclenche un nouveau déploiement Vercel.

---

## Configuration Firebase requise

Dans la [Firebase Console](https://console.firebase.google.com) :

1. **Authentication** → Méthode de connexion → Activer **Email/Mot de passe** et **Google**
2. **Firestore Database** → Créer (mode test pour débuter)
3. Ajouter votre domaine Vercel dans Authentication → Domaines autorisés

### Règles Firestore (production)

Remplacez les règles de test par :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /workspaces/{workspaceId} {
      allow read, write: if request.auth.uid in resource.data.memberUids;
      allow create: if request.auth != null;
      match /boxes/{boxId} {
        allow read, write: if request.auth.uid in
          get(/databases/$(database)/documents/workspaces/$(workspaceId)).data.memberUids;
        match /items/{itemId} {
          allow read, write: if request.auth.uid in
            get(/databases/$(database)/documents/workspaces/$(workspaceId)).data.memberUids;
        }
      }
    }
    match /invites/{code} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

---

## Structure du projet

```
src/
├── components/     # Composants réutilisables
│   ├── Layout.jsx
│   ├── ProtectedRoute.jsx
│   ├── SearchBar.jsx
│   ├── BoxCard.jsx
│   ├── BoxForm.jsx
│   ├── ItemCard.jsx
│   ├── ItemForm.jsx
│   └── ConfirmDialog.jsx
├── context/
│   └── AuthContext.jsx   # Auth + workspaceId global
├── hooks/
│   ├── useBoxes.js       # Temps réel boîtes
│   ├── useItems.js       # Temps réel éléments
│   └── useSearch.js      # Recherche globale
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── HomePage.jsx      # Liste des boîtes
│   ├── BoxDetailPage.jsx # Éléments d'une boîte
│   ├── MembersPage.jsx   # Gestion membres
│   ├── JoinPage.jsx      # Rejoindre via code
│   └── NotFoundPage.jsx
└── services/
    ├── firebase.js           # Initialisation Firebase
    ├── boxService.js         # CRUD boîtes
    ├── itemService.js        # CRUD éléments
    ├── cloudinaryService.js  # Upload photos
    └── inviteService.js      # Invitations membres
```
