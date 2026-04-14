# StorageApp

Application web progressive (PWA) pour gérer l'inventaire de boîtes de rangement en famille.

**Stack :** React 19 + Vite 8 + Firebase (Auth, Firestore) + Cloudinary + GitHub Pages

---

## Démarrage local

### 1. Cloner le projet

```bash
git clone https://github.com/sleeplow/storage-app.git
cd storage-app
npm install
```

### 2. Configurer les variables d'environnement

Copiez `.env.example` en `.env.local` et remplissez vos valeurs :

```bash
cp .env.example .env.local
```

Les valeurs Firebase se trouvent dans : Firebase Console → Paramètres du projet → Vos applications

### 3. Lancer le serveur de développement

```bash
npm run dev
# http://localhost:5173
```

---

## Déploiement

Le déploiement est automatique via GitHub Actions à chaque `git push` sur `main`.

Les variables d'environnement doivent être ajoutées dans **GitHub → Settings → Secrets and variables → Actions**.

---

## Configuration Firebase

### Services requis

Dans la [Firebase Console](https://console.firebase.google.com) :

1. **Authentication** → Méthode de connexion → Activer **Email/Mot de passe** et **Google**
2. **Firestore Database** → Créer en mode production
3. **Authentication → Domaines autorisés** → Ajouter votre domaine de production

### Règles Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isMember(workspaceId) {
      return request.auth.uid in
        get(/databases/$(database)/documents/workspaces/$(workspaceId)).data.memberUids;
    }
    function isAdmin(workspaceId) {
      return request.auth.uid ==
        get(/databases/$(database)/documents/workspaces/$(workspaceId)).data.adminUid;
    }

    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    match /workspaces/{workspaceId} {
      allow read: if isMember(workspaceId);
      allow create: if request.auth != null
        && request.resource.data.adminUid == request.auth.uid
        && request.resource.data.memberUids.hasOnly([request.auth.uid]);
      allow update: if isAdmin(workspaceId);

      match /boxes/{boxId} {
        allow read: if isMember(workspaceId);
        allow create, update: if isMember(workspaceId)
          && request.resource.data.name is string
          && request.resource.data.name.size() > 0
          && request.resource.data.name.size() <= 60;
        allow delete: if isMember(workspaceId);

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

    // Recherche globale via collectionGroup
    match /{path=**}/items/{itemId} {
      allow read: if request.auth != null
        && isMember(resource.data.workspaceId);
    }

    // Invitations — admin uniquement, expiration vérifiée côté serveur
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
├── components/
│   ├── Layout.jsx          # Header + navigation
│   ├── ProtectedRoute.jsx  # Garde de route authentifiée
│   ├── SearchBar.jsx       # Recherche globale temps réel
│   ├── BoxCard.jsx         # Carte d'une boîte
│   ├── BoxForm.jsx         # Modal créer/modifier boîte
│   ├── ItemCard.jsx        # Carte d'un élément
│   ├── ItemForm.jsx        # Modal créer/modifier élément + photo
│   └── ConfirmDialog.jsx   # Dialog de confirmation
├── context/
│   └── AuthContext.jsx     # Session utilisateur + workspaceId
├── hooks/
│   ├── useBoxes.js         # Abonnement temps réel boîtes
│   ├── useItems.js         # Abonnement temps réel éléments
│   └── useSearch.js        # Recherche dans les éléments
├── pages/
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   ├── HomePage.jsx        # Liste des boîtes
│   ├── BoxDetailPage.jsx   # Éléments d'une boîte
│   ├── MembersPage.jsx     # Gestion des membres
│   ├── JoinPage.jsx        # Rejoindre via code d'invitation
│   └── NotFoundPage.jsx
└── services/
    ├── firebase.js             # Initialisation Firebase
    ├── boxService.js           # CRUD boîtes (Firestore)
    ├── itemService.js          # CRUD éléments (Firestore + writeBatch)
    ├── cloudinaryService.js    # Upload photos (Cloudinary)
    └── inviteService.js        # Codes d'invitation membres
```
