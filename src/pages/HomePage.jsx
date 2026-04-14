import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useBoxes } from '../hooks/useBoxes'
import { createBox, updateBox, deleteBox } from '../services/boxService'
import BoxCard from '../components/BoxCard'
import BoxForm from '../components/BoxForm'
import ConfirmDialog from '../components/ConfirmDialog'

export default function HomePage() {
  const { user, workspaceId } = useAuth()
  const { boxes, loading } = useBoxes(workspaceId)

  const [showForm, setShowForm] = useState(false)
  const [editingBox, setEditingBox] = useState(null)
  const [deletingBox, setDeletingBox] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const nextNumber = boxes.length > 0 ? Math.max(...boxes.map((b) => b.number)) + 1 : 1

  const handleCreate = async ({ name }) => {
    setSaving(true)
    try {
      await createBox(workspaceId, { name }, user.uid)
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async ({ name }) => {
    setSaving(true)
    try {
      await updateBox(workspaceId, editingBox.id, { name })
      setEditingBox(null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteBox(workspaceId, deletingBox.id)
      setDeletingBox(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Mes boîtes</h2>
        <button className="btn btn-primary btn-new" onClick={() => setShowForm(true)}>
          + Nouvelle boîte
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: '12rem' }}>
          <div className="loading-spinner" />
        </div>
      ) : boxes.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">📦</p>
          <p className="empty-title">Aucune boîte pour l&apos;instant</p>
          <p className="empty-subtitle">Créez votre première boîte pour commencer l&apos;inventaire.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem', width: 'auto' }} onClick={() => setShowForm(true)}>
            + Créer une boîte
          </button>
        </div>
      ) : (
        <div className="box-list">
          {boxes.map((box) => (
            <BoxCard
              key={box.id}
              box={box}
              onEdit={setEditingBox}
              onDelete={setDeletingBox}
            />
          ))}
        </div>
      )}

      {showForm && (
        <BoxForm
          nextNumber={nextNumber}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          loading={saving}
        />
      )}

      {editingBox && (
        <BoxForm
          initial={editingBox}
          nextNumber={nextNumber}
          onSubmit={handleEdit}
          onClose={() => setEditingBox(null)}
          loading={saving}
        />
      )}

      {deletingBox && (
        <ConfirmDialog
          message={`Supprimer la boîte #${deletingBox.number} — ${deletingBox.name} ? Tous ses éléments seront également supprimés.`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingBox(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
