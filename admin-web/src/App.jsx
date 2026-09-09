import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layout/AdminLayout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Users from './pages/Users.jsx'
import Clubs from './pages/Clubs.jsx'
import Review from './pages/Review.jsx'
import Structure from './pages/Structure.jsx'

const TOKEN_KEY = 'admin_token'

function RequireAuth({ children }) {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="clubs" element={<Clubs />} />
          <Route path="review" element={<Review />} />
          <Route path="structure" element={<Structure />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
