import { useEffect, useState, useMemo } from 'react'
import { collectionGroup, onSnapshot, query } from 'firebase/firestore'
import { db } from '../services/firebase'

// Charge tous les items du workspace via collectionGroup et filtre en local
export function useSearch(workspaceId) {
  const [allItems, setAllItems] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(true)

  useEffect(() => {
    if (!workspaceId) return

    // collectionGroup('items') récupère tous les items de tous les workspace —
    // les règles Firestore limiteront l'accès au bon workspace en production.
    // Pour l'instant on filtre côté client sur workspaceId (présent dans le path).
    const q = query(collectionGroup(db, 'items'))
    const unsubscribe = onSnapshot(q, (snap) => {
      const items = snap.docs
        .filter((d) => d.ref.path.includes(`workspaces/${workspaceId}`))
        .map((d) => {
          // path = workspaces/{wsId}/boxes/{boxId}/items/{itemId}
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
      .map((item) => {
        const box = boxes.find((b) => b.id === item.boxId)
        return { ...item, box }
      })
  }

  return { search, loadingSearch }
}
