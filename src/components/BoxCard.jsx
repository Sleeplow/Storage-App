import { Link } from 'react-router-dom'

export default function BoxCard({ box, onEdit, onDelete }) {
  const count = box.itemCount ?? 0
  const itemLabel = count === 1 ? 'item' : 'items'

  return (
    <div className="box-card">
      <Link to={`/boxes/${box.id}`} className="box-card-link">
        <div className="box-number">#{box.number}</div>
        <div className="box-info">
          <h3 className="box-name">{box.name}</h3>
          {box.location && (
            <span className="box-location">📍 {box.location}</span>
          )}
        </div>
        <span className="box-count-badge">
          {count}
          <span className="box-count-label">{itemLabel}</span>
        </span>
        <span className="box-arrow">›</span>
      </Link>
      <div className="box-actions">
        <button
          className="btn-icon"
          onClick={() => onEdit(box)}
          title="Modifier"
          aria-label={`Modifier ${box.name}`}
        >
          ✏️
        </button>
        <button
          className="btn-icon btn-icon-danger"
          onClick={() => onDelete(box)}
          title="Supprimer"
          aria-label={`Supprimer ${box.name}`}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
