import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../services/firebase'
import { appError, mapFirebaseError } from '../services/errorCodes'
import { useAuth } from '../context/AuthContext'

const googleProvider = new GoogleAuthProvider()

export default function RegisterPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Dès que l'auth state passe à "connecté", on laisse React Router rediriger.
  if (user) return <Navigate to="/" replace />

  const handleEmailRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      return setError('Les mots de passe ne correspondent pas.')
    }
    if (password.length < 6) {
      return setError('Le mot de passe doit contenir au moins 6 caractères.')
    }

    setLoading(true)
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)

      // Créer le workspace de l'admin
      const workspaceId = newUser.uid
      await setDoc(doc(db, 'workspaces', workspaceId), {
        adminUid: newUser.uid,
        memberUids: [newUser.uid],
        createdAt: serverTimestamp(),
      })
      await setDoc(doc(db, 'users', newUser.uid), {
        email: newUser.email,
        displayName: '',
        workspaceId,
        role: 'admin',
        createdAt: serverTimestamp(),
      })
      // Pas de navigate() — le <Navigate> ci-dessus prend le relais.
    } catch (err) {
      setError(appError(mapFirebaseError(err) ?? 'AUTH-004', err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setError('')
    setLoading(true)
    try {
      // AuthContext gère automatiquement la création du workspace au premier login Google
      await signInWithPopup(auth, googleProvider)
      // Pas de navigate() — le <Navigate> ci-dessus prend le relais.
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(appError(mapFirebaseError(err) ?? 'AUTH-007', err))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">StorageApp</h1>
        <p className="auth-subtitle">Créer votre espace famille</p>

        <button
          type="button"
          className="btn btn-google"
          onClick={handleGoogleRegister}
          disabled={loading}
        >
          <GoogleIcon />
          Continuer avec Google
        </button>

        <div className="auth-divider">
          <span>ou</span>
        </div>

        <form onSubmit={handleEmailRegister} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              required
              autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm">Confirmer le mot de passe</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="auth-link">
          Déjà un compte ?{' '}
          <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

