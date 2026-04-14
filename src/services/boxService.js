import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import { appError } from './errorCodes'
import { logAction } from './logger'

function boxesRef(workspaceId) {
  return collection(db, 'workspaces', workspaceId, 'boxes')
}

// Calcule le prochain numéro de boîte disponible
async function getNextBoxNumber(workspaceId) {
  const snap = await getDocs(boxesRef(workspaceId))
  if (snap.empty) return 1
  const numbers = snap.docs.map((d) => d.data().number || 0)
  return Math.max(...numbers) + 1
}

export async function createBox(workspaceId, { name }, userId) {
  try {
    const number = await getNextBoxNumber(workspaceId)
    const docRef = await addDoc(boxesRef(workspaceId), {
      number,
      name: name.trim(),
      itemCount: 0,
      createdAt: serverTimestamp(),
      createdBy: userId,
    })
    logAction('box', 'create', name.trim())
    return docRef.id
  } catch (err) {
    throw new Error(appError('BOX-002', err))
  }
}

export async function updateBox(workspaceId, boxId, { name }) {
  try {
    await updateDoc(doc(db, 'workspaces', workspaceId, 'boxes', boxId), {
      name: name.trim(),
    })
    logAction('box', 'update', name.trim())
  } catch (err) {
    throw new Error(appError('BOX-003', err))
  }
}

export async function deleteBox(workspaceId, boxId) {
  try {
    const itemsRef = collection(db, 'workspaces', workspaceId, 'boxes', boxId, 'items')
    const itemsSnap = await getDocs(itemsRef)
    const deletions = itemsSnap.docs.map((d) => deleteDoc(d.ref))
    await Promise.all(deletions)
    await deleteDoc(doc(db, 'workspaces', workspaceId, 'boxes', boxId))
    logAction('box', 'delete', boxId)
  } catch (err) {
    throw new Error(appError('BOX-004', err))
  }
}

export function getBoxesQuery(workspaceId) {
  return query(boxesRef(workspaceId), orderBy('number', 'asc'))
}
