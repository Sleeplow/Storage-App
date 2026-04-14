# StorageApp

Application web progressive (PWA) pour gérer l'inventaire de boîtes de rangement en famille (2 à 5 personnes).

**Stack :** React 19 + Vite 8 + Firebase (Auth, Firestore) + Cloudinary + GitHub Pages

**URL de production :** [storage.sleeplow.ca](https://storage.sleeplow.ca)

---

## Démarrage local

### 1. Cloner le projet

```bash
git clone https://github.com/sleeplow/storage-app.git
cd storage-app
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` est requis à cause de vite-plugin-pwa qui n'est pas encore compatible avec Vite 8.

### 2. Variables d'environnement

Créez un fichier `.env.local` à la racine (jamais commité dans git) :

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

Les valeurs Firebase se trouvent dans : Firebase Console → Paramètres du projet → Vos applications.
Pour Cloudinary : utilisez uniquement le **Cloud Name** et le **Upload Preset non signé** — ne jamais mettre l'API Secret dans le frontend.

### 3. Démarrer le serveur de développement

```bash
npm run dev
# http://localhost:5173
```

---

## Déploiement

Le déploiement est **automatique** via GitHub Actions à chaque `git push` sur `main`.

Le workflow (`.github/workflows/deploy.yml`) :
1. Installe les dépendances (`npm ci --legacy-peer-deps`)
2. Compile le projet (`npm run build`) avec les secrets injectés
3. Publie le dossier `dist/` sur la branche `gh-pages`

Les variables d'environnement doivent être configurées dans :
**GitHub → Settings → Secrets and variables → Actions**

Ajoutez les 8 variables du `.env.local` comme secrets (même nom, même valeur).

### Domaine personnalisé

Le fichier `public/CNAME` contient `storage.sleeplow.ca` et est inclus automatiquement dans le build.
Le DNS doit pointer vers GitHub Pages (enregistrement CNAME vers `sleeplow.github.io`).

### Routing SPA

GitHub Pages ne gère pas nativement le routing côté client. La solution utilisée :
- `public/404.html` : redirige toutes les 404 vers `index.html` avec le chemin encodé dans l'URL
- `index.html` : décode et restaure le chemin avant que React Router prenne le relais

---

## Configuration Firebase

### Services requis

Dans la [Firebase Console](https://console.firebase.google.com) :

1. **Authentication** → Méthode de connexion → Activer **Google** uniquement (l'auth email/mot de passe est désactivée dans l'app)
2. **Firestore Database** → Créer en mode production
3. **Authentication → Domaines autorisés** → Ajouter `storage.sleeplow.ca` et `localhost`

### Règles Firestore (v3 — production)

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

## Logger de session

`src/services/logger.js` maintient un journal en mémoire (réinitialisé à chaque rechargement) des actions de l'utilisateur et des erreurs.

```js
import { logAction } from './services/logger'

logAction('box', 'create', 'Décorations Noël')  // category, action, detail
logAction('error', 'BOX-002', 'permission-denied')
```

Le journal est utilisé par la fonctionnalité **Rapporter un bug** (Paramètres → Support) pour pré-remplir un courriel avec le contexte complet de la session.

Toutes les erreurs via `appError()` sont automatiquement enregistrées. Les services `boxService`, `itemService` et `AuthContext` enregistrent aussi les opérations réussies.

---

## Système de codes d'erreur

Toutes les erreurs de l'application sont tracées via `src/services/errorCodes.js`.

### Format

L'utilisateur voit : `"Impossible de créer la boîte. (ERR-BOX-002)"`
La console affiche : `[ERR-BOX-002] permission-denied Missing or insufficient permissions.`

### Catégories

| Préfixe     | Domaine                              |
|-------------|--------------------------------------|
| `AUTH-xxx`  | Authentification, workspace init     |
| `BOX-xxx`   | CRUD des boîtes                      |
| `ITEM-xxx`  | CRUD des éléments                    |
| `PHOTO-xxx` | Upload Cloudinary, validation fichier|
| `SEARCH-xxx`| Recherche collectionGroup            |
| `INVITE-xxx`| Codes d'invitation, membres          |
| `FIREBASE-xxx` | Erreurs Firebase génériques       |

### Ajouter un nouveau code

1. Ajouter l'entrée dans `ERROR_MESSAGES` dans `errorCodes.js`
2. Appeler `appError('MON-CODE', err)` dans le hook/service/page concerné

```js
// Dans un service
try {
  await someFirestoreOp()
} catch (err) {
  throw new Error(appError('BOX-002', err))  // log + message utilisateur
}

// Dans une page
} catch (err) {
  setOpError(err.message)  // le message contient déjà le code
}
```

---

## Structure du projet

```
src/
├── components/
│   ├── Layout.jsx          # Header + avatar Google → SettingsPanel
│   ├── SettingsPanel.jsx   # Drawer paramètres (compte, stats, thème, bug report)
│   ├── ProtectedRoute.jsx  # Garde de route authentifiée
│   ├── SearchBar.jsx       # Recherche globale temps réel
│   ├── BoxCard.jsx         # Carte d'une boîte
│   ├── BoxForm.jsx         # Modal créer/modifier boîte
│   ├── ItemCard.jsx        # Carte d'un élément
│   ├── ItemForm.jsx        # Modal créer/modifier élément + photo
│   └── ConfirmDialog.jsx   # Dialog de confirmation générique
├── context/
│   └── AuthContext.jsx     # Session utilisateur + workspaceId + authError
├── hooks/
│   ├── useBoxes.js         # Abonnement temps réel boîtes
│   ├── useItems.js         # Abonnement temps réel éléments
│   ├── useSearch.js        # Recherche globale (collectionGroup)
│   └── useTheme.js         # Préférence light/dark/system (localStorage)
├── pages/
│   ├── LoginPage.jsx       # Google Sign-In uniquement
│   ├── RegisterPage.jsx    # Redirige vers /login
│   ├── HomePage.jsx        # Liste des boîtes
│   ├── BoxDetailPage.jsx   # Éléments d'une boîte
│   ├── MembersPage.jsx     # Gestion des membres + invitation
│   ├── JoinPage.jsx        # Rejoindre via code d'invitation
│   └── NotFoundPage.jsx
└── services/
    ├── firebase.js             # Initialisation Firebase
    ├── errorCodes.js           # Registre ERR-XXX + helper appError()
    ├── logger.js               # Journal de session en mémoire (bug reports)
    ├── boxService.js           # CRUD boîtes (Firestore)
    ├── itemService.js          # CRUD éléments (writeBatch atomique)
    ├── cloudinaryService.js    # Upload/validation photos
    └── inviteService.js        # Codes d'invitation (runTransaction atomique)
```

### Modèle de données Firestore

```
users/{uid}
  email, displayName, workspaceId, role, createdAt

workspaces/{workspaceId}
  adminUid, memberUids[], createdAt
  └── boxes/{boxId}
        number, name, itemCount, createdAt, createdBy
        └── items/{itemId}
              name, description, photoUrl, photoPublicId,
              workspaceId,  ← champ dénormalisé pour collectionGroup
              createdAt, createdBy

invites/{code}
  workspaceId, invitedBy, createdAt, expiresAt, used, usedBy?
```

---

## Décisions techniques notables

| Sujet | Choix | Raison |
|-------|-------|--------|
| Authentification | Google Sign-In uniquement | UX simplifiée, pas de gestion de mots de passe |
| Dark mode | `data-theme` sur `<html>` + CSS custom props | Pas de JS au runtime pour les couleurs, flip instantané |
| Thème initial | Script dans `main.jsx` avant `createRoot` | Évite le flash de thème au chargement |
| Photos | Cloudinary (upload preset non signé) | Firebase Storage nécessite Blaze (payant) |
| itemCount | `writeBatch` atomique | Évite les race conditions sur le compteur |
| Rejoindre un espace | `runTransaction` | Empêche la double utilisation d'un code d'invitation |
| Recherche | `collectionGroup` + `where('workspaceId')` | Filtre côté serveur — défense en profondeur |
| Routing SPA | `public/404.html` redirect trick | GitHub Pages ne supporte pas le routing côté client |
| Codes d'invitation | `crypto.getRandomValues` | Évite Math.random() qui n'est pas cryptographiquement sûr |
| Logger de session | Module-level array (mémoire) | Pas de stockage persistant — données effacées à la fermeture |
</content>
</invoke>