import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply saved theme before first render to prevent flash
const savedTheme = localStorage.getItem('storageapp-theme')
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark')
} else if (savedTheme === 'light') {
  document.documentElement.setAttribute('data-theme', 'light')
}
// 'system' or missing → let @media prefers-color-scheme handle it

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
