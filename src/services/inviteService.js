import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db } from './firebase'

// Génère un code cryptographiquement sûr de 8 caractères
function generateSecureCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sans 0/O/1/I pour éviter la confusion
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('')
}

export async function createInvite(workspaceId, invitedByUid) {
  const code = generateSecureCode()
  await setDoc(doc(db, 'invites', code), {
    workspaceId,
    invitedBy: invitedByUid,
    createdAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
    used: false,
  })
  return code
}

// Rejoindre un workspace via code — transaction atomique pour éviter double utilisation
export async function joinWithCode(code, user) {
  const inviteRef = doc(db, 'invites', code.toUpperCase())
  const userRef = doc(db, 'users', user.uid)

  return await runTransaction(db, async (transaction) => {
    const inviteSnap = await transaction.get(inviteRef)
    if (!inviteSnap.exists()) throw new Error('Code d\'invitation invalide.')

    const invite = inviteSnap.data()
    if (invite.used) throw new Error('Ce code d\'invitation a déjà été utilisé.')
    if (invite.expiresAt.toDate() < new Date()) throw new Error('Ce code d\'invitation a expiré.')

    const workspaceRef = doc(db, 'workspaces', invite.workspaceId)
    const wsSnap = await transaction.get(workspaceRef)
    if (!wsSnap.exists()) throw new Error('Espace introuvable.')

    const ws = wsSnap.data()
    if (ws.memberUids.length >= 5) throw new Error('L\'espace a atteint la limite de 5 membres.')
    if (ws.memberUids.includes(user.uid)) throw new Error('Vous êtes déjà membre de cet espace.')

    // Tout atomique : marquer utilisé + ajouter membre
    transaction.update(inviteRef, { used: true, usedBy: user.uid })
    transaction.update(workspaceRef, { memberUids: arrayUnion(user.uid) })
    transaction.set(userRef, {
      email: user.email,
      displayName: user.displayName || '',
      workspaceId: invite.workspaceId,
      role: 'member',
      createdAt: serverTimestamp(),
    }, { merge: true })

    return invite.workspaceId
  })
}

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

export async function removeMember(workspaceId, memberUid) {
  await updateDoc(doc(db, 'workspaces', workspaceId), {
    memberUids: arrayRemove(memberUid),
  })
  await updateDoc(doc(db, 'users', memberUid), { workspaceId: null, role: null })
}
