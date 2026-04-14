import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../services/firebase'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <Link to="/" className="app-logo">
          StorageApp
        </Link>
        <nav className="app-nav">
          {user && (
            <button onClick={handleLogout} className="btn btn-ghost">
              Déconnexion
            </button>
          )}
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
