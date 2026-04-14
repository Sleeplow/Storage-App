import { useParams } from 'react-router-dom'

export default function BoxDetailPage() {
  const { id } = useParams()
  return (
    <div className="page">
      <h2>Boîte #{id}</h2>
      <p>Phase 4 — Gestion des éléments à venir.</p>
    </div>
  )
}
