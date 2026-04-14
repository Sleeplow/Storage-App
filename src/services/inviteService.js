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
import { appError } from './errorCodes'

// Génère un code cryptographiquement sûr de 8 caractères
function generateSecureCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sans 0/O/1/I pour éviter la confusion
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes).map((b) => chars[b % chars.length]).join('')
}

export async function createInvite(workspaceId, invitedByUid) {
  try {
    const code = generateSecureCode()
    await setDoc(doc(db, 'invites', code), {
      workspaceId,
      invitedBy: invitedByUid,
      createdAt: serverTimestamp(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      used: false,
    })
    return code
  } catch (err) {
    throw new Error(appError('INVITE-001', err))
  }
}

// Rejoindre un workspace via code — transaction atomique pour éviter double utilisation
export async function joinWithCode(code, user) {
  const inviteRef = doc(db, 'invites', code.toUpperCase())
  const userRef = doc(db, 'users', user.uid)

  try {
    return await runTransaction(db, async (transaction) => {
      const inviteSnap = await transaction.get(inviteRef)
      if (!inviteSnap.exists()) throw new Error(appError('INVITE-002', null))

      const invite = inviteSnap.data()
      if (invite.used) throw new Error(appError('INVITE-003', null))
      if (invite.expiresAt.toDate() < new Date()) throw new Error(appError('INVITE-004', null))

      const workspaceRef = doc(db, 'workspaces', invite.workspaceId)
      const wsSnap = await transaction.get(workspaceRef)
      if (!wsSnap.exists()) throw new Error(appError('FIREBASE-003', null))

      const ws = wsSnap.data()
      if (ws.memberUids.length >= 5) throw new Error(appError('INVITE-005', null))
      if (ws.memberUids.includes(user.uid)) throw new Error(appError('INVITE-006', null))

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
  } catch (err) {
    // Re-throw domain errors (already have appError message), wrap generic ones
    if (err.message?.includes('ERR-')) throw err
    throw new Error(appError('INVITE-007', err))
  }
}

export async function getWorkspaceMembers(workspaceId) {
  try {
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
  } catch (err) {
    throw new Error(appError('INVITE-008', err))
  }
}

export async function removeMember(workspaceId, memberUid) {
  try {
    await updateDoc(doc(db, 'workspaces', workspaceId), {
      memberUids: arrayRemove(memberUid),
    })
    await updateDoc(doc(db, 'users', memberUid), { workspaceId: null, role: null })
  } catch (err) {
    throw new Error(appError('INVITE-009', err))
  }
}
