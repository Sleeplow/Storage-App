import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { useAuth } from '../context/AuthContext'

export default function SettingsPanel({ open, onClose, theme, setTheme }) {
  const { user, workspaceId } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!open || !workspaceId) return
    let cancelled = false

    async function loadStats() {
      try {
        // Boxes + item counts from itemCount fields
        const boxesSnap = await getDocs(
          collection(db, 'workspaces', workspaceId, 'boxes')
        )
        const boxCount = boxesSnap.size
        const itemCount = boxesSnap.docs.reduce(
          (sum, d) => sum + (d.data().itemCount || 0),
          0
        )

        // Photos: items with a non-empty photoUrl
        const itemsSnap = await getDocs(
          query(collectionGroup(db, 'items'), where('workspaceId', '==', workspaceId))
        )
        const photoCount = itemsSnap.docs.filter((d) => d.data().photoUrl).length

        if (!cancelled) setStats({ boxCount, itemCount, photoCount })
      } catch {
        if (!cancelled) setStats({ boxCount: '—', itemCount: '—', photoCount: '—' })
      }
    }

    setStats(null)
    loadStats()
    return () => { cancelled = true }
  }, [open, workspaceId])

  const handleLogout = async () => {
    await signOut(auth)
    onClose()
  }

  const handleMembers = () => {
    navigate('/members')
    onClose()
  }

  if (!open) return null

  const displayName = user?.displayName || user?.email || 'Utilisateur'

  return (
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
            </div>
          </div>

          {/* Service stats */}
          <div className="settings-section">
            <p className="settings-section-title">Espace de rangement</p>
            {stats ? (
              <>
                <div className="settings-stat-row">
                  <span className="settings-stat-icon">📦</span>
                  <span className="settings-stat-label">Firebase</span>
                  <span className="settings-stat-value">
                    {stats.boxCount} boîte{stats.boxCount !== 1 ? 's' : ''} · {stats.itemCount} item{stats.itemCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="settings-stat-row">
                  <span className="settings-stat-icon">🖼️</span>
                  <span className="settings-stat-label">Cloudinary</span>
                  <span className="settings-stat-value">
                    {stats.photoCount} photo{stats.photoCount !== 1 ? 's' : ''}
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

          {/* Logout */}
          <div className="settings-section settings-logout">
            <button className="btn btn-danger" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
