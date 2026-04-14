import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { getItemsQuery } from '../services/itemService'

export function useItems(workspaceId, boxId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!workspaceId || !boxId) return

    const q = getItemsQuery(workspaceId, boxId)
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('useItems error:', err.message)
        setError(err)
        setLoading(false)
      }
    )

    return unsubscribe
  }, [workspaceId, boxId])

  return { items, loading, error }
}
