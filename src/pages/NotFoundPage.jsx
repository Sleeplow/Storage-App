import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h2>404 — Page introuvable</h2>
        <p>Cette page n&apos;existe pas.</p>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-block', marginTop: '1rem' }}>
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
