import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../services/firebase'
import { useAuth } from '../context/AuthContext'
import SearchBar from './SearchBar'

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
          📦 StorageApp
        </Link>
        <SearchBar />
        <nav className="app-nav">
          <Link to="/members" className="btn btn-ghost btn-nav">
            👥
          </Link>
          {user && (
            <button onClick={handleLogout} className="btn btn-ghost btn-nav">
              ⎋
            </button>
          )}
        </nav>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
