import { getOptimizedUrl } from '../services/cloudinaryService'

export default function ItemCard({ item, onEdit, onDelete }) {
  return (
    <div className="item-card">
      {item.photoUrl && (
        <div className="item-photo-wrap">
          <img
            src={getOptimizedUrl(item.photoUrl, 160)}
            alt={item.name}
            className="item-photo"
            loading="lazy"
          />
        </div>
      )}
      <div className="item-info">
        <h4 className="item-name">{item.name}</h4>
        {item.description && (
          <p className="item-description">{item.description}</p>
        )}
      </div>
      <div className="box-actions">
        <button
          className="btn-icon"
          onClick={() => onEdit(item)}
          title="Modifier"
          aria-label={`Modifier ${item.name}`}
        >
          ✏️
        </button>
        <button
          className="btn-icon btn-icon-danger"
          onClick={() => onDelete(item)}
          title="Supprimer"
          aria-label={`Supprimer ${item.name}`}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}
