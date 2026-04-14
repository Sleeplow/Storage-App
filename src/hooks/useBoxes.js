import { useEffect, useState } from 'react'
import { onSnapshot } from 'firebase/firestore'
import { getBoxesQuery } from '../services/boxService'
import { appError } from '../services/errorCodes'

export function useBoxes(workspaceId) {
  const [boxes, setBoxes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!workspaceId) return

    const q = getBoxesQuery(workspaceId)
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setBoxes(data)
        setLoading(false)
      },
      (err) => {
        setError(new Error(appError('BOX-001', err)))
        setLoading(false)
      }
    )

    return unsubscribe
  }, [workspaceId])

  return { boxes, loading, error }
}
