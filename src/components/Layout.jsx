import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import SearchBar from './SearchBar'
import SettingsPanel from './SettingsPanel'

export default function Layout({ children }) {
  const { user } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [theme, setTheme] = useTheme()

  const displayName = user?.displayName || user?.email || '?'

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/" className="app-logo">
          📦 StorageApp
        </Link>
        <SearchBar />
        <nav className="app-nav">
          <button
            className="nav-avatar-btn"
            onClick={() => setSettingsOpen(true)}
            aria-label="Paramètres"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                className="nav-avatar"
                alt=""
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="nav-avatar-fallback">
                {displayName[0].toUpperCase()}
              </div>
            )}
          </button>
        </nav>
      </header>
      <main className="app-main">{children}</main>
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
      />
    </div>
  )
}
