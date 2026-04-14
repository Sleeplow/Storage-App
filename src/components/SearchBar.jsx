import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBoxes } from '../hooks/useBoxes'
import { useSearch } from '../hooks/useSearch'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  const { workspaceId } = useAuth()
  const { boxes } = useBoxes(workspaceId)
  const { search } = useSearch(workspaceId)

  const results = query.trim().length >= 1 ? search(query, boxes) : []

  // Fermer le panneau si on clique ailleurs
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (item) => {
    navigate(`/boxes/${item.boxId}`)
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="search-wrap" ref={wrapRef}>
      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="search"
          className="search-input"
          placeholder="Rechercher un élément…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
        />
        {query && (
          <button className="search-clear" onClick={() => { setQuery(''); setOpen(false) }}>
            ✕
          </button>
        )}
      </div>

      {open && query.trim().length >= 1 && (
        <div className="search-results">
          {results.length === 0 ? (
            <p className="search-empty">Aucun résultat pour &ldquo;{query}&rdquo;</p>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                className="search-result-item"
                onClick={() => handleSelect(item)}
              >
                <span className="search-item-name">{item.name}</span>
                {item.box && (
                  <span className="search-item-box">
                    #{item.box.number} — {item.box.name}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
