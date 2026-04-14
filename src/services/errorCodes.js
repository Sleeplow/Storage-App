// ─── Error Code Registry ───────────────────────────────────────────────────
// Each code maps to a French user-facing message.
// To find a specific error in the code, search for its tag, e.g. [ERR-AUTH-001]
// ────────────────────────────────────────────────────────────────────────────

const ERROR_MESSAGES = {
  // ── Auth / Workspace init ──────────────────────────────────────────────
  'AUTH-001': 'Connexion Firebase impossible. Vérifiez votre connexion internet.',
  'AUTH-002': 'Accès à votre espace refusé. Contactez l\'administrateur.',
  'AUTH-003': 'Erreur lors de la connexion. Réessayez.',
  'AUTH-004': 'Erreur lors de l\'inscription. Réessayez.',
  'AUTH-005': 'Email ou mot de passe incorrect.',
  'AUTH-006': 'Cet email est déjà utilisé par un autre compte.',
  'AUTH-007': 'Connexion Google annulée ou échouée.',
  'AUTH-008': 'Erreur d\'initialisation de l\'espace de travail.',
  'AUTH-009': 'Trop de tentatives. Réessayez plus tard.',
  'AUTH-010': 'Mot de passe trop faible. Minimum 6 caractères.',

  // ── Boxes ──────────────────────────────────────────────────────────────
  'BOX-001': 'Impossible de charger les boîtes.',
  'BOX-002': 'Impossible de créer la boîte.',
  'BOX-003': 'Impossible de modifier la boîte.',
  'BOX-004': 'Impossible de supprimer la boîte.',
  'BOX-005': 'Boîte introuvable — elle a peut-être été supprimée.',

  // ── Items ──────────────────────────────────────────────────────────────
  'ITEM-001': 'Impossible de charger les éléments.',
  'ITEM-002': 'Impossible de créer l\'élément. Cette boîte a peut-être été supprimée.',
  'ITEM-003': 'Impossible de modifier l\'élément.',
  'ITEM-004': 'Impossible de supprimer l\'élément.',
  'ITEM-005': 'Élément introuvable — il a peut-être été supprimé.',

  // ── Photos / Cloudinary ────────────────────────────────────────────────
  'PHOTO-001': 'Type de fichier non supporté. Utilisez JPEG, PNG, WebP, GIF, HEIC ou HEIF.',
  'PHOTO-002': 'Fichier trop volumineux. Taille maximale : 10 Mo.',
  'PHOTO-003': 'Échec de l\'upload de la photo. Réessayez.',
  'PHOTO-004': 'Réponse invalide du serveur photo.',

  // ── Search ─────────────────────────────────────────────────────────────
  'SEARCH-001': 'Impossible d\'effectuer la recherche.',

  // ── Invites / Members ──────────────────────────────────────────────────
  'INVITE-001': 'Impossible de créer le code d\'invitation.',
  'INVITE-002': 'Code d\'invitation invalide.',
  'INVITE-003': 'Ce code d\'invitation a déjà été utilisé.',
  'INVITE-004': 'Ce code d\'invitation a expiré.',
  'INVITE-005': 'L\'espace a atteint la limite de 5 membres.',
  'INVITE-006': 'Vous êtes déjà membre de cet espace.',
  'INVITE-007': 'Impossible de rejoindre l\'espace. Réessayez.',
  'INVITE-008': 'Impossible de charger la liste des membres.',
  'INVITE-009': 'Impossible de retirer ce membre.',

  // ── Generic Firebase / Network ─────────────────────────────────────────
  'FIREBASE-001': 'Action non autorisée.',
  'FIREBASE-002': 'Quota Firebase dépassé. Réessayez plus tard.',
  'FIREBASE-003': 'Ressource introuvable.',
  'FIREBASE-004': 'Erreur réseau. Vérifiez votre connexion.',
}

/**
 * Logs the error to the console with its code tag and returns a
 * user-facing message with the code appended.
 *
 * Usage:
 *   throw new Error(appError('BOX-001', err))
 *   setOpError(appError('ITEM-003', err))
 *
 * @param {string} code  - one of the ERR-XXX-NNN keys above
 * @param {unknown} originalError - the raw error from Firebase / fetch / etc.
 * @returns {string} user-facing message, e.g. "Impossible de charger les boîtes. (ERR-BOX-001)"
 */
export function appError(code, originalError) {
  const tag = `[ERR-${code}]`
  if (originalError) {
    console.error(tag, originalError?.code ?? '', originalError?.message ?? originalError)
  } else {
    console.error(tag)
  }
  const message = ERROR_MESSAGES[code] ?? 'Une erreur inattendue est survenue.'
  return `${message} (ERR-${code})`
}

/**
 * Maps common Firebase error codes to an app-level error code string.
 * Returns null if no specific mapping found (caller should use a default code).
 *
 * @param {unknown} err - Firebase error object
 * @returns {string|null}
 */
export function mapFirebaseError(err) {
  switch (err?.code) {
    case 'permission-denied':    return 'FIREBASE-001'
    case 'resource-exhausted':   return 'FIREBASE-002'
    case 'not-found':            return 'FIREBASE-003'
    case 'unavailable':
    case 'deadline-exceeded':    return 'FIREBASE-004'
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential': return 'AUTH-005'
    case 'auth/email-already-in-use': return 'AUTH-006'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request': return 'AUTH-007'
    case 'auth/too-many-requests': return 'AUTH-009'
    case 'auth/weak-password': return 'AUTH-010'
    default: return null
  }
}
