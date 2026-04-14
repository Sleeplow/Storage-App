import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getWorkspaceMembers, createInvite, removeMember } from '../services/inviteService'
import ConfirmDialog from '../components/ConfirmDialog'

export default function MembersPage() {
  const { user, workspaceId } = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteCode, setInviteCode] = useState(null)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [removingMember, setRemovingMember] = useState(null)
  const [copied, setCopied] = useState(false)
  const [opError, setOpError] = useState('')

  const isAdmin = members.find((m) => m.uid === user?.uid)?.role === 'admin'

  useEffect(() => {
    if (!workspaceId) return
    loadMembers()
  }, [workspaceId])

  const loadMembers = async () => {
    setLoading(true)
    setOpError('')
    try {
      const data = await getWorkspaceMembers(workspaceId)
      setMembers(data)
    } catch (err) {
      setOpError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCode = async () => {
    setGeneratingCode(true)
    setOpError('')
    try {
      const code = await createInvite(workspaceId, user.uid)
      setInviteCode(code)
    } catch (err) {
      setOpError(err.message)
    } finally {
      setGeneratingCode(false)
    }
  }

  const inviteLink = inviteCode
    ? `${window.location.origin}/join?code=${inviteCode}`
    : null

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      // Partage natif : iOS/Android ouvre Mail, Messages, WhatsApp, etc.
      try {
        await navigator.share({
          title: 'Invitation StorageApp',
          text: 'Rejoins notre espace de rangement familial :',
          url: inviteLink,
        })
      } catch {
        // L'utilisateur a annulé le partage — pas d'erreur à afficher
      }
    } else {
      // Fallback desktop : ouvre le client mail par défaut
      window.location.href = `mailto:?subject=${encodeURIComponent('Invitation StorageApp')}&body=${encodeURIComponent(`Rejoins notre espace de rangement familial :\n${inviteLink}`)}`
    }
  }

  const handleRemove = async () => {
    setOpError('')
    try {
      await removeMember(workspaceId, removingMember.uid)
      setRemovingMember(null)
      loadMembers()
    } catch (err) {
      setOpError(err.message)
      setRemovingMember(null)
    }
  }

  return (
    <div className="page">
      {opError && <p className="error-message" style={{ marginBottom: '1rem' }}>{opError}</p>}
      <div className="page-header">
        <h2>Membres de l&apos;espace</h2>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '8rem' }}>
          <div className="loading-spinner" />
        </div>
      ) : (
        <>
          <div className="members-list">
            {members.map((m) => (
              <div key={m.uid} className="member-card">
                <div className="member-avatar">
                  {(m.displayName || m.email || '?')[0].toUpperCase()}
                </div>
                <div className="member-info">
                  <p className="member-name">{m.displayName || m.email}</p>
                  {m.displayName && <p className="member-email">{m.email}</p>}
                </div>
                <span className={`member-badge ${m.role === 'admin' ? 'badge-admin' : 'badge-member'}`}>
                  {m.role === 'admin' ? 'Admin' : 'Membre'}
                </span>
                {isAdmin && m.uid !== user.uid && (
                  <button
                    className="btn-icon btn-icon-danger"
                    onClick={() => setRemovingMember(m)}
                    title="Retirer"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {isAdmin && members.length < 5 && (
            <div className="invite-section">
              <h3>Inviter un membre</h3>
              <p className="invite-hint">
                Générez un code à partager — valable 7 jours, limité à 1 utilisation.
              </p>
              {inviteCode ? (
                <div className="invite-code-wrap">
                  <div style={{ width: '100%' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.35rem' }}>
                      Lien à partager (SMS, courriel…)
                    </p>
                    <p style={{
                      fontSize: '0.8rem',
                      wordBreak: 'break-all',
                      background: 'var(--color-bg)',
                      color: 'var(--color-text)',
                      border: '1px solid var(--color-border)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      marginBottom: '0.5rem',
                      fontFamily: 'monospace',
                    }}>
                      {inviteLink}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Code seul : <strong style={{ letterSpacing: '0.1em' }}>{inviteCode}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', width: '100%', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleShare}>
                      {typeof navigator !== 'undefined' && navigator.share ? '↗ Partager' : '✉ Envoyer par courriel'}
                    </button>
                    <button className="btn btn-outline" style={{ width: 'auto' }} onClick={handleCopy}>
                      {copied ? '✓ Copié !' : 'Copier le lien'}
                    </button>
                    <button className="btn btn-ghost" style={{ width: 'auto' }} onClick={() => setInviteCode(null)}>
                      Nouveau code
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ width: 'auto', marginTop: '0.75rem' }}
                  onClick={handleGenerateCode}
                  disabled={generatingCode}
                >
                  {generatingCode ? 'Génération…' : '+ Générer un code d\'invitation'}
                </button>
              )}
            </div>
          )}

          {members.length >= 5 && (
            <p className="invite-hint" style={{ marginTop: '1.5rem' }}>
              Limite de 5 membres atteinte.
            </p>
          )}
        </>
      )}

      {removingMember && (
        <ConfirmDialog
          message={`Retirer ${removingMember.displayName || removingMember.email} de l'espace ?`}
          confirmLabel="Retirer"
          onConfirm={handleRemove}
          onCancel={() => setRemovingMember(null)}
        />
      )}
    </div>
  )
}
