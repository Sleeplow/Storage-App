import { Navigate } from 'react-router-dom'

// Email/password registration removed — Google Sign-In only.
// Redirect anyone who lands on /register to the login page.
export default function RegisterPage() {
  return <Navigate to="/login" replace />
}
