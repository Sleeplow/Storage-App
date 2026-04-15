import { useState, useEffect, useRef } from 'react'

export default function BoxForm({ initial = null, nextNumber, onSubmit, onClose, loading }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name, location })
  }

  const title = initial ? `Modifier la boîte #${initial.number}` : `Nouvelle boîte — #${nextNumber}`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="box-name">Nom de la boîte</label>
            <input
              id="box-name"
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex : Cuisine d'été, Outils garage…"
              maxLength={60}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="box-location">Lieu <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(optionnel)</span></label>
            <input
              id="box-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="ex : Sous-sol, Garage, Chambre #2…"
              maxLength={60}
            />
          </div>
          <div className="confirm-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" style={{ width: 'auto' }} disabled={loading || !name.trim()}>
              {loading ? 'Enregistrement...' : initial ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
