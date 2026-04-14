import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collectionGroup, getDocs, query, where } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import { useBoxes } from '../hooks/useBoxes'
import { logAction, formatReport } from '../services/logger'
import ConfirmDialog from './ConfirmDialog'

// ─── Bug Report Modal ────────────────────────────────────────────────────────

function BugReportModal({ onClose }) {
  const [description, setDescription] = useState('')
  const [copied, setCopied] = useState(false)

  const report = formatReport(description)

  const handleCopy = () => {
    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    logAction('bug-report', 'copy')
  }

  const handleEmail = () => {
    const subject = encodeURIComponent('Rapport de bug — StorageApp')
    const body = encodeURIComponent(report)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    logAction('bug-report', 'email')
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 400 }} onClick={onClose}>
      <div
        className="modal-card modal-card-lg"
        style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 className="modal-title" style={{ margin: 0 }}>🐛 Rapporter un bug</h3>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label htmlFor="bug-description">Description du problème</label>
          <textarea
            id="bug-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez ce qui s'est passé, ce que vous faisiez, ce que vous attendiez…"
            rows={4}
          />
        </div>

        <div style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.625rem 0.75rem',
          fontFamily: 'monospace',
          fontSize: '0.72rem',
          color: 'var(--color-text-muted)',
          maxHeight: '12rem',
          overflowY: 'auto',
          whiteSpace: 'pre',
          marginBottom: '1rem',
        }}>
          {report}
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleEmail}>
            ✉ Envoyer par courriel
          </button>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleCopy}>
            {copied ? '✓ Copié !' : 'Copier le rapport'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Settings Panel ──────────────────────────────────────────────────────────

export default function SettingsPanel({ open, onClose, theme, setTheme }) {
  const { user, workspaceId } = useAuth()
  const navigate = useNavigate()

  const { boxes, loading: boxesLoading } = useBoxes(open ? workspaceId : null)
  const [photoCount, setPhotoCount] = useState(null)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [bugOpen, setBugOpen] = useState(false)

  const boxCount = boxes.length
  const itemCount = boxes.reduce((sum, b) => sum + (b.itemCount || 0), 0)

  useEffect(() => {
    if (!open || !workspaceId) return
    let cancelled = false
    setPhotoCount(null)

    getDocs(query(collectionGroup(db, 'items'), where('workspaceId', '==', workspaceId)))
      .then((snap) => {
        if (!cancelled) setPhotoCount(snap.docs.filter((d) => d.data().photoUrl).length)
      })
      .catch(() => {
        if (!cancelled) setPhotoCount('—')
      })

    return () => { cancelled = true }
  }, [open, workspaceId])

  const handleLogout = async () => {
    logAction('auth', 'logout-manual', user?.email ?? '')
    await signOut(auth)
    setConfirmLogout(false)
    onClose()
  }

  const handleMembers = () => {
    navigate('/members')
    onClose()
  }

  if (!open) return null

  const displayName = user?.displayName || user?.email || 'Utilisateur'

  return (
    <>
      <div className="settings-overlay" onClick={onClose}>
        <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
          <div className="settings-header">
            <h2>Paramètres</h2>
            <button className="settings-close" onClick={onClose} aria-label="Fermer">✕</button>
          </div>

          <div className="settings-body">
            {/* Google account */}
            <div className="settings-section">
              <p className="settings-section-title">Compte Google</p>
              <div className="settings-user">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    className="settings-avatar-lg"
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="settings-avatar-lg-fallback">
                    {displayName[0].toUpperCase()}
                  </div>
                )}
                <div className="settings-user-info">
                  <p className="settings-user-name">{displayName}</p>
                  <p className="settings-user-email">{user?.email}</p>
                </div>
                <button
                  className="btn-icon btn-icon-danger"
                  onClick={() => setConfirmLogout(true)}
                  title="Déconnecter"
                  style={{ marginLeft: 'auto', flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Service stats */}
            <div className="settings-section">
              <p className="settings-section-title">Espace de rangement</p>
              {!boxesLoading ? (
                <>
                  <div className="settings-stat-row">
                    <span className="settings-stat-icon">📦</span>
                    <span className="settings-stat-label">Firebase</span>
                    <span className="settings-stat-value">
                      {boxCount} boîte{boxCount !== 1 ? 's' : ''} · {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="settings-stat-row">
                    <span className="settings-stat-icon">🖼️</span>
                    <span className="settings-stat-label">Cloudinary</span>
                    <span className="settings-stat-value">
                      {photoCount === null
                        ? '…'
                        : `${photoCount} photo${photoCount !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '0.75rem' }}>
                  <div className="loading-spinner" style={{ width: '1.5rem', height: '1.5rem', borderWidth: '2px' }} />
                </div>
              )}
            </div>

            {/* Members */}
            <div className="settings-section">
              <p className="settings-section-title">Membres</p>
              <button
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'flex-start', gap: '0.625rem' }}
                onClick={handleMembers}
              >
                <span>👥</span> Gérer les membres
              </button>
            </div>

            {/* Theme toggle */}
            <div className="settings-section">
              <p className="settings-section-title">Apparence</p>
              <div className="theme-toggle">
                <button
                  className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <span>☀️</span>
                  Clair
                </button>
                <button
                  className={`theme-btn ${theme === 'system' ? 'active' : ''}`}
                  onClick={() => setTheme('system')}
                >
                  <span>⚙️</span>
                  Système
                </button>
                <button
                  className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <span>🌙</span>
                  Sombre
                </button>
              </div>
            </div>

            {/* Bug report */}
            <div className="settings-section">
              <p className="settings-section-title">Support</p>
              <button
                className="btn btn-outline"
                style={{ width: '100%', justifyContent: 'flex-start', gap: '0.625rem' }}
                onClick={() => setBugOpen(true)}
              >
                <span>🐛</span> Rapporter un bug
              </button>
            </div>

            {/* Logout */}
            <div className="settings-section settings-logout">
              <button className="btn btn-danger" onClick={() => setConfirmLogout(true)}>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      {confirmLogout && (
        <ConfirmDialog
          message="Vous allez être déconnecté de StorageApp. Souhaitez-vous continuer ?"
          confirmLabel="Déconnecter"
          onConfirm={handleLogout}
          onCancel={() => setConfirmLogout(false)}
        />
      )}

      {bugOpen && <BugReportModal onClose={() => setBugOpen(false)} />}
    </>
  )
}
