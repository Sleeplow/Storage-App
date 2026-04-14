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

### Règles Firestore (production — renforcées)

Copiez ces règles dans Firebase Console → Firestore → Règles :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helpers
    function isMember(workspaceId) {
      return request.auth.uid in
        get(/databases/$(database)/documents/workspaces/$(workspaceId)).data.memberUids;
    }
    function isAdmin(workspaceId) {
      return request.auth.uid ==
        get(/databases/$(database)/documents/workspaces/$(workspaceId)).data.adminUid;
    }

    // Profils utilisateurs : accès au seul propriétaire
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Workspaces
    match /workspaces/{workspaceId} {
      allow read: if isMember(workspaceId);
      allow create: if request.auth != null
        && request.resource.data.adminUid == request.auth.uid
        && request.resource.data.memberUids.hasOnly([request.auth.uid]);
      // Seul l'admin peut modifier les membres
      allow update: if isAdmin(workspaceId);

      // Boîtes : membres en lecture/écriture, validation longueur du nom
      match /boxes/{boxId} {
        allow read: if isMember(workspaceId);
        allow create: if isMember(workspaceId)
          && request.resource.data.name is string
          && request.resource.data.name.size() > 0
          && request.resource.data.name.size() <= 60;
        allow update: if isMember(workspaceId)
          && request.resource.data.name is string
          && request.resource.data.name.size() > 0
          && request.resource.data.name.size() <= 60;
        allow delete: if isMember(workspaceId);

        // Éléments (items) — avec workspaceId pour collectionGroup search
        match /items/{itemId} {
          allow read: if isMember(workspaceId);
          allow create: if isMember(workspaceId)
            && request.resource.data.name is string
            && request.resource.data.name.size() > 0
            && request.resource.data.name.size() <= 80
            && request.resource.data.workspaceId == workspaceId;
          allow update: if isMember(workspaceId)
            && request.resource.data.name is string
            && request.resource.data.name.size() > 0
            && request.resource.data.name.size() <= 80;
          allow delete: if isMember(workspaceId);
        }
      }
    }

    // Support collectionGroup pour la recherche globale
    match /{path=**}/items/{itemId} {
      allow read: if request.auth != null
        && isMember(resource.data.workspaceId);
    }

    // Invitations — création admin uniquement, expiration côté serveur
    match /invites/{code} {
      allow read: if request.auth != null
        && resource.data.expiresAt > request.time;
      allow create: if request.auth != null
        && isAdmin(request.resource.data.workspaceId)
        && request.resource.data.used == false;
      allow update: if request.auth != null
        && resource.data.used == false
        && resource.data.expiresAt > request.time;
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
