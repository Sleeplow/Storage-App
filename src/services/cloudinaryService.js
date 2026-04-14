const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

// Upload un fichier image vers Cloudinary et retourne { url, publicId }
export async function uploadPhoto(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', 'storage-app')

  const res = await fetch(UPLOAD_URL, { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Échec de l\'upload photo')

  const data = await res.json()
  return {
    url: data.secure_url,
    publicId: data.public_id,
  }
}

// Retourne une URL optimisée (redimensionnée) pour l'affichage
export function getOptimizedUrl(url, width = 400) {
  if (!url || !url.includes('cloudinary.com')) return url
  return url.replace('/upload/', `/upload/w_${width},c_limit,q_auto,f_auto/`)
}
