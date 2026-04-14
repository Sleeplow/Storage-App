import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
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
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      // Créer le workspace de l'admin
      const workspaceId = user.uid
      await setDoc(doc(db, 'workspaces', workspaceId), {
        adminUid: user.uid,
        memberUids: [user.uid],
        createdAt: serverTimestamp(),
      })

      // Enregistrer le workspaceId sur le profil utilisateur
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        workspaceId,
        role: 'admin',
        createdAt: serverTimestamp(),
      })

      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">StorageApp</h1>
        <p className="auth-subtitle">Créer votre espace famille</p>
        <form onSubmit={handleSubmit} className="auth-form">
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

function getErrorMessage(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Cet email est déjà utilisé.'
    case 'auth/invalid-email':
      return 'Adresse email invalide.'
    case 'auth/weak-password':
      return 'Mot de passe trop faible. Minimum 6 caractères.'
    default:
      return 'Une erreur est survenue. Réessayez.'
  }
}
