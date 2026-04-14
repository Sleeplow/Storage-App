/**
 * Logger de session — stockage en mémoire uniquement (effacé à chaque rechargement).
 * Utilisé pour pré-remplir les rapports de bug.
 */

const MAX_ENTRIES = 150
const entries = []

/**
 * @param {'auth'|'box'|'item'|'photo'|'invite'|'search'|'error'} category
 * @param {string} action  ex: 'login', 'create', 'delete', 'upload'
 * @param {string} [detail] info complémentaire (nom, ID, message…)
 */
export function logAction(category, action, detail = '') {
  entries.push({
    t: new Date().toISOString().slice(11, 19), // HH:MM:SS
    category,
    action,
    detail: detail ? String(detail).slice(0, 250) : '',
  })
  if (entries.length > MAX_ENTRIES) entries.shift()
}

export function getLogs() {
  return [...entries]
}

export function formatReport(userDescription = '') {
  const lines = [
    '=== Rapport de bug — StorageApp ===',
    `Date    : ${new Date().toLocaleString('fr-CA')}`,
    `Agent   : ${navigator.userAgent}`,
    `URL     : ${window.location.href}`,
  ]
  if (userDescription.trim()) {
    lines.push('', 'Description :', userDescription.trim())
  }
  lines.push(`\nJournaux de session (${entries.length} entrées) :`)
  if (entries.length === 0) {
    lines.push('  (aucune action enregistrée)')
  } else {
    entries.forEach((e) => {
      lines.push(
        `[${e.t}] ${e.category.toUpperCase().padEnd(7)} ${e.action}${e.detail ? ' — ' + e.detail : ''}`
      )
    })
  }
  lines.push('', '=== Fin du rapport ===')
  return lines.join('\n')
}
