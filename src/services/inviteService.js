import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from './firebase'

// Créer une invitation (code unique basé sur timestamp + random)
export async function createInvite(workspaceId, invitedByUid) {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase()
  const inviteRef = doc(db, 'invites', code)
  await setDoc(inviteRef, {
    workspaceId,
    invitedBy: invitedByUid,
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    used: false,
  })
  return code
}

// Rejoindre un workspace via un code d'invitation
export async function joinWithCode(code, user) {
  const inviteRef = doc(db, 'invites', code.toUpperCase())
  const inviteSnap = await getDoc(inviteRef)

  if (!inviteSnap.exists()) throw new Error('Code d\'invitation invalide.')

  const invite = inviteSnap.data()
  if (invite.used) throw new Error('Ce code d\'invitation a déjà été utilisé.')
  if (invite.expiresAt.toDate() < new Date()) throw new Error('Ce code d\'invitation a expiré.')

  const workspaceRef = doc(db, 'workspaces', invite.workspaceId)
  const wsSnap = await getDoc(workspaceRef)
  if (!wsSnap.exists()) throw new Error('Espace introuvable.')

  const ws = wsSnap.data()
  if (ws.memberUids.length >= 5) throw new Error('L\'espace a atteint la limite de 5 membres.')
  if (ws.memberUids.includes(user.uid)) throw new Error('Vous êtes déjà membre de cet espace.')

  // Ajouter l'utilisateur au workspace
  await updateDoc(workspaceRef, { memberUids: arrayUnion(user.uid) })

  // Mettre à jour le profil utilisateur
  await setDoc(doc(db, 'users', user.uid), {
    email: user.email,
    displayName: user.displayName || '',
    workspaceId: invite.workspaceId,
    role: 'member',
    createdAt: serverTimestamp(),
  }, { merge: true })

  // Marquer l'invitation comme utilisée
  await updateDoc(inviteRef, { used: true, usedBy: user.uid })

  return invite.workspaceId
}

// Récupérer les membres d'un workspace
export async function getWorkspaceMembers(workspaceId) {
  const wsSnap = await getDoc(doc(db, 'workspaces', workspaceId))
  if (!wsSnap.exists()) return []

  const { memberUids } = wsSnap.data()
  const members = await Promise.all(
    memberUids.map(async (uid) => {
      const userSnap = await getDoc(doc(db, 'users', uid))
      return userSnap.exists() ? { uid, ...userSnap.data() } : { uid, email: uid }
    })
  )
  return members
}

// Retirer un membre (admin seulement)
export async function removeMember(workspaceId, memberUid) {
  await updateDoc(doc(db, 'workspaces', workspaceId), {
    memberUids: arrayRemove(memberUid),
  })
  await updateDoc(doc(db, 'users', memberUid), { workspaceId: null, role: null })
}
