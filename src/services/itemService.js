import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { appError } from './errorCodes'
import { logAction } from './logger'

function itemsRef(workspaceId, boxId) {
  return collection(db, 'workspaces', workspaceId, 'boxes', boxId, 'items')
}

function boxRef(workspaceId, boxId) {
  return doc(db, 'workspaces', workspaceId, 'boxes', boxId)
}

// Création atomique : item + itemCount en un seul batch
export async function createItem(workspaceId, boxId, { name, description, photoUrl, photoPublicId }, userId) {
  try {
    const batch = writeBatch(db)

    const newItemRef = doc(itemsRef(workspaceId, boxId))
    batch.set(newItemRef, {
      name: name.trim(),
      description: description?.trim() || '',
      photoUrl: photoUrl || '',
      photoPublicId: photoPublicId || '',
      workspaceId, // nécessaire pour le filtrage collectionGroup dans la recherche
      createdAt: serverTimestamp(),
      createdBy: userId,
    })

    batch.update(boxRef(workspaceId, boxId), { itemCount: increment(1) })

    await batch.commit()
    logAction('item', 'create', name.trim())
    return newItemRef.id
  } catch (err) {
    throw new Error(appError('ITEM-002', err))
  }
}

export async function updateItem(workspaceId, boxId, itemId, { name, description, photoUrl, photoPublicId }) {
  try {
    const updates = {
      name: name.trim(),
      description: description?.trim() || '',
    }
    if (photoUrl !== undefined) updates.photoUrl = photoUrl
    if (photoPublicId !== undefined) updates.photoPublicId = photoPublicId

    await updateDoc(doc(db, 'workspaces', workspaceId, 'boxes', boxId, 'items', itemId), updates)
    logAction('item', 'update', name.trim())
  } catch (err) {
    throw new Error(appError('ITEM-003', err))
  }
}

// Suppression atomique : item + itemCount en un seul batch
export async function deleteItem(workspaceId, boxId, itemId) {
  try {
    const batch = writeBatch(db)
    batch.delete(doc(db, 'workspaces', workspaceId, 'boxes', boxId, 'items', itemId))
    batch.update(boxRef(workspaceId, boxId), { itemCount: increment(-1) })
    await batch.commit()
    logAction('item', 'delete', itemId)
  } catch (err) {
    throw new Error(appError('ITEM-004', err))
  }
}

export function getItemsQuery(workspaceId, boxId) {
  return query(itemsRef(workspaceId, boxId), orderBy('createdAt', 'asc'))
}
