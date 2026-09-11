import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AdminLayout from './layout/AdminLayout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Users from './pages/Users.jsx'
import Clubs from './pages/Clubs.jsx'
import Review from './pages/Review.jsx'
import Structure from './pages/Structure.jsx'
import Settings from './pages/Settings.jsx'
import Files from './pages/Files.jsx'
import Admins from './pages/Admins.jsx'
import Account from './pages/Account.jsx'
import { isSuperAdmin } from './utils/auth'

const TOKEN_KEY = 'admin_token'

function RequireAuth({ children }) {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

/**
 * 超级管理员专属路由守卫。
 * 管理端布局会先回源 /me 刷新层级；普通管理员直接输入这些地址会被重定向回仪表盘。
 * 即使绕过前端，后端 SecurityConfig 对管理员组管理接口同样返回 403。
 */
function RequireSuper({ children }) {
  if (!isSuperAdmin()) {
    return <Navigate to="/" replace />
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
          {/* 我的账号：所有管理员可用（普通管理员仅能修改自身令牌） */}
          <Route path="account" element={<Account />} />
          {/* 以下为超级管理员专属 */}
          <Route path="files" element={<RequireSuper><Files /></RequireSuper>} />
          <Route path="admins" element={<RequireSuper><Admins /></RequireSuper>} />
          <Route path="settings" element={<RequireSuper><Settings /></RequireSuper>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
