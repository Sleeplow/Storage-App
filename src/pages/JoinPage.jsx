import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { joinWithCode } from '../services/inviteService'

export default function JoinPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const c = searchParams.get('code')
    if (c) setCode(sanitizeCode(c))
  }, [searchParams])

  const sanitizeCode = (val) => val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)

  const handleJoin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await joinWithCode(code, user)
      // Rechargement complet pour que AuthContext récupère le nouveau workspaceId
      window.location.replace('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Rejoindre un espace</h1>
        <p className="auth-subtitle">Entrez le code d&apos;invitation reçu</p>
        <form onSubmit={handleJoin} className="auth-form">
          <div className="form-group">
            <label htmlFor="code">Code d&apos;invitation</label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(sanitizeCode(e.target.value))}
              placeholder="ex : AB3C7D2E"
              maxLength={8}
              required
              autoComplete="off"
              style={{ letterSpacing: '0.2em', textAlign: 'center', fontWeight: '700', fontSize: '1.25rem' }}
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading || code.length < 8}>
            {loading ? 'Vérification…' : 'Rejoindre'}
          </button>
        </form>
      </div>
    </div>
  )
}
