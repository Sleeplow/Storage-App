import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from './firebase'

function itemsRef(workspaceId, boxId) {
  return collection(db, 'workspaces', workspaceId, 'boxes', boxId, 'items')
}

function boxRef(workspaceId, boxId) {
  return doc(db, 'workspaces', workspaceId, 'boxes', boxId)
}

export async function createItem(workspaceId, boxId, { name, description, photoUrl, photoPublicId }, userId) {
  const docRef = await addDoc(itemsRef(workspaceId, boxId), {
    name: name.trim(),
    description: description?.trim() || '',
    photoUrl: photoUrl || '',
    photoPublicId: photoPublicId || '',
    createdAt: serverTimestamp(),
    createdBy: userId,
  })
  // Incrémenter le compteur d'éléments de la boîte
  await updateDoc(boxRef(workspaceId, boxId), { itemCount: increment(1) })
  return docRef.id
}

export async function updateItem(workspaceId, boxId, itemId, { name, description, photoUrl, photoPublicId }) {
  const updates = {
    name: name.trim(),
    description: description?.trim() || '',
  }
  if (photoUrl !== undefined) updates.photoUrl = photoUrl
  if (photoPublicId !== undefined) updates.photoPublicId = photoPublicId
  await updateDoc(doc(db, 'workspaces', workspaceId, 'boxes', boxId, 'items', itemId), updates)
}

export async function deleteItem(workspaceId, boxId, itemId) {
  await deleteDoc(doc(db, 'workspaces', workspaceId, 'boxes', boxId, 'items', itemId))
  // Décrémenter le compteur d'éléments de la boîte
  await updateDoc(boxRef(workspaceId, boxId), { itemCount: increment(-1) })
}

export function getItemsQuery(workspaceId, boxId) {
  return query(itemsRef(workspaceId, boxId), orderBy('createdAt', 'asc'))
}
