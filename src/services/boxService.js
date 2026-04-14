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
  const number = await getNextBoxNumber(workspaceId)
  const docRef = await addDoc(boxesRef(workspaceId), {
    number,
    name: name.trim(),
    itemCount: 0,
    createdAt: serverTimestamp(),
    createdBy: userId,
  })
  return docRef.id
}

export async function updateBox(workspaceId, boxId, { name }) {
  await updateDoc(doc(db, 'workspaces', workspaceId, 'boxes', boxId), {
    name: name.trim(),
  })
}

export async function deleteBox(workspaceId, boxId) {
  // Supprimer tous les éléments de la boîte avant de la supprimer
  const itemsRef = collection(db, 'workspaces', workspaceId, 'boxes', boxId, 'items')
  const itemsSnap = await getDocs(itemsRef)
  const deletions = itemsSnap.docs.map((d) => deleteDoc(d.ref))
  await Promise.all(deletions)
  await deleteDoc(doc(db, 'workspaces', workspaceId, 'boxes', boxId))
}

export function getBoxesQuery(workspaceId) {
  return query(boxesRef(workspaceId), orderBy('number', 'asc'))
}
