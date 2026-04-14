import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../services/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [workspaceId, setWorkspaceId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const wsId = await getOrCreateWorkspace(currentUser)
          setUser(currentUser)
          setWorkspaceId(wsId)
          setAuthError(null)
        } catch (err) {
          console.error('Workspace init failed:', err.code)
          setUser(currentUser)
          setWorkspaceId(null)
          setAuthError(
            err.code === 'permission-denied'
              ? 'Accès à votre espace refusé. Contactez l\'admin.'
              : 'Erreur de connexion au serveur. Rechargez la page.'
          )
        }
      } else {
        setUser(null)
        setWorkspaceId(null)
        setAuthError(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  return (
    <AuthContext.Provider value={{ user, workspaceId, loading, authError }}>
      {children}
    </AuthContext.Provider>
  )
}

async function getOrCreateWorkspace(user) {
  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (userSnap.exists()) {
    return userSnap.data().workspaceId
  }

  // Premier login Google — créer le workspace automatiquement
  const workspaceId = user.uid
  await setDoc(doc(db, 'workspaces', workspaceId), {
    adminUid: user.uid,
    memberUids: [user.uid],
    createdAt: serverTimestamp(),
  })
  await setDoc(userRef, {
    email: user.email,
    displayName: user.displayName || '',
    workspaceId,
    role: 'admin',
    createdAt: serverTimestamp(),
  })

  return workspaceId
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider')
  }
  return context
}
