import { useEffect, useState } from 'react'
import { collectionGroup, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../services/firebase'

// Abonnement temps réel sur tous les items du workspace via collectionGroup filtré côté serveur
export function useSearch(workspaceId) {
  const [allItems, setAllItems] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(true)

  useEffect(() => {
    if (!workspaceId) return

    // Filtre côté serveur : seuls les items avec workspaceId == workspaceId sont retournés.
    // Les règles Firestore garantissent l'accès — ce filtre est une défense en profondeur.
    const q = query(
      collectionGroup(db, 'items'),
      where('workspaceId', '==', workspaceId)
    )

    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => {
        const pathParts = d.ref.path.split('/')
        const boxId = pathParts[3]
        return { id: d.id, boxId, ...d.data() }
      })
      setAllItems(items)
      setLoadingSearch(false)
    })

    return unsubscribe
  }, [workspaceId])

  const search = (term, boxes) => {
    if (!term.trim()) return []
    const lower = term.toLowerCase()
    return allItems
      .filter(
        (item) =>
          item.name?.toLowerCase().includes(lower) ||
          item.description?.toLowerCase().includes(lower)
      )
      .map((item) => ({
        ...item,
        box: boxes.find((b) => b.id === item.boxId),
      }))
  }

  return { search, loadingSearch }
}
