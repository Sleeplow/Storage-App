import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading, authError } = useAuth()

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (authError) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</p>
          <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Problème de connexion</p>
          <p className="error-message" style={{ marginBottom: '1rem' }}>{authError}</p>
          <button
            className="btn btn-primary"
            style={{ width: 'auto' }}
            onClick={() => window.location.reload()}
          >
            Recharger
          </button>
        </div>
      </div>
    )
  }

  return children
}
