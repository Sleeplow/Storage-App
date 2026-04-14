import { appError } from './errorCodes'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
const MAX_SIZE_MB = 10
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export async function uploadPhoto(file) {
  // Validation type MIME
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(appError('PHOTO-001', null))
  }

  // Validation taille
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(appError('PHOTO-002', null))
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'storage-app')

  let res
  try {
    res = await fetch(UPLOAD_URL, { method: 'POST', body: formData })
  } catch (err) {
    throw new Error(appError('PHOTO-003', err))
  }

  if (!res.ok) throw new Error(appError('PHOTO-003', { code: res.status, message: res.statusText }))

  const data = await res.json()

  // Vérifier que l'URL retournée provient bien de Cloudinary
  if (!data.secure_url?.includes('cloudinary.com')) {
    throw new Error(appError('PHOTO-004', { code: 'invalid-url', message: data.secure_url }))
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
  }
}

export function getOptimizedUrl(url, width = 400) {
  if (!url || !url.includes('cloudinary.com')) return url
  return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`)
}
