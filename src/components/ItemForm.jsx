import { useState, useRef, useEffect } from 'react'
import { uploadPhoto } from '../services/cloudinaryService'

export default function ItemForm({ initial = null, onSubmit, onClose, loading }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(initial?.photoUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const cameraRef = useRef(null)
  const galleryRef = useRef(null)
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  const handleFileChange = (file) => {
    if (!file) return
    setPhotoFile(file)
    setUploadError('')
    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (cameraRef.current) cameraRef.current.value = ''
    if (galleryRef.current) galleryRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return

    setUploading(true)
    setUploadError('')

    try {
      let photoUrl = initial?.photoUrl ?? ''
      let photoPublicId = initial?.photoPublicId ?? ''

      if (photoFile) {
        const result = await uploadPhoto(photoFile)
        photoUrl = result.url
        photoPublicId = result.publicId
      } else if (photoPreview === null) {
        // Photo supprimée
        photoUrl = ''
        photoPublicId = ''
      }

      await onSubmit({ name, description, photoUrl, photoPublicId })
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const isBusy = loading || uploading

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">
          {initial ? 'Modifier l\'élément' : 'Nouvel élément'}
        </h3>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="item-name">Nom *</label>
            <input
              id="item-name"
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex : Cafetière, Perceuse, Skis…"
              maxLength={80}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="item-desc">Description</label>
            <textarea
              id="item-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails, état, couleur…"
              maxLength={300}
            />
          </div>

          {/* Sélecteur de photo */}
          <div className="form-group">
            <label>Photo (optionnel)</label>
            {photoPreview ? (
              <div className="photo-preview-wrap">
                <img src={photoPreview} alt="Aperçu" className="photo-preview" />
                <button
                  type="button"
                  className="photo-remove"
                  onClick={handleRemovePhoto}
                  aria-label="Supprimer la photo"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="photo-picker">
                <label className="photo-btn">
                  📷 Caméra
                  <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </label>
                <label className="photo-btn">
                  🖼️ Galerie
                  <input
                    ref={galleryRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
            {uploadError && <p className="error-message" style={{ marginTop: '0.5rem' }}>{uploadError}</p>}
          </div>

          <div className="confirm-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isBusy}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: 'auto' }}
              disabled={isBusy || !name.trim()}
            >
              {uploading ? 'Upload photo…' : isBusy ? 'Enregistrement…' : initial ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
