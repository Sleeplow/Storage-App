import { useState } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBoxes } from '../hooks/useBoxes'
import { useItems } from '../hooks/useItems'
import { createItem, updateItem, deleteItem } from '../services/itemService'
import ItemCard from '../components/ItemCard'
import ItemForm from '../components/ItemForm'
import ConfirmDialog from '../components/ConfirmDialog'

function getFirebaseErrorMessage(err) {
  if (err?.code === 'permission-denied') return 'Action non autorisée.'
  if (err?.code === 'not-found') return 'Élément introuvable — il a peut-être été supprimé.'
  if (err?.code === 'resource-exhausted') return 'Quota dépassé. Réessayez plus tard.'
  return 'Une erreur est survenue. Réessayez.'
}

export default function BoxDetailPage() {
  const { id: boxId } = useParams()
  const { user, workspaceId } = useAuth()
  const { boxes, loading: boxesLoading } = useBoxes(workspaceId)
  const { items, loading } = useItems(workspaceId, boxId)
  const navigate = useNavigate()

  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [opError, setOpError] = useState('')

  const box = boxes.find((b) => b.id === boxId)

  // Redirection si la boîte n'existe pas dans ce workspace
  if (!boxesLoading && boxes.length > 0 && !box) {
    return <Navigate to="/" replace />
  }

  const handleCreate = async (data) => {
    setSaving(true)
    setOpError('')
    try {
      await createItem(workspaceId, boxId, data, user.uid)
      setShowForm(false)
    } catch (err) {
      if (err?.code === 'not-found' || err?.code === 'permission-denied') {
        setOpError('Cette boîte a été supprimée.')
        setTimeout(() => navigate('/'), 1500)
      } else {
        setOpError(getFirebaseErrorMessage(err))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (data) => {
    setSaving(true)
    setOpError('')
    try {
      await updateItem(workspaceId, boxId, editingItem.id, data)
      setEditingItem(null)
    } catch (err) {
      setOpError(getFirebaseErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setOpError('')
    try {
      await deleteItem(workspaceId, boxId, deletingItem.id)
      setDeletingItem(null)
    } catch (err) {
      setOpError(getFirebaseErrorMessage(err))
      setDeletingItem(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page">
      {opError && <p className="error-message" style={{ marginBottom: '1rem' }}>{opError}</p>}
      <div className="page-header">
        <div className="breadcrumb">
          <Link to="/" className="breadcrumb-link">← Boîtes</Link>
          {box && (
            <h2>
              <span className="box-number-sm">#{box.number}</span> {box.name}
            </h2>
          )}
        </div>
        <button className="btn btn-primary btn-new" onClick={() => setShowForm(true)}>
          + Ajouter
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '12rem' }}>
          <div className="loading-spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">🔍</p>
          <p className="empty-title">Cette boîte est vide</p>
          <p className="empty-subtitle">Ajoutez votre premier élément.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '1rem', width: 'auto' }}
            onClick={() => setShowForm(true)}
          >
            + Ajouter un élément
          </button>
        </div>
      ) : (
        <div className="item-list">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={setEditingItem}
              onDelete={setDeletingItem}
            />
          ))}
        </div>
      )}

      {showForm && (
        <ItemForm
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          loading={saving}
        />
      )}

      {editingItem && (
        <ItemForm
          initial={editingItem}
          onSubmit={handleEdit}
          onClose={() => setEditingItem(null)}
          loading={saving}
        />
      )}

      {deletingItem && (
        <ConfirmDialog
          message={`Supprimer "${deletingItem.name}" ?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingItem(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
