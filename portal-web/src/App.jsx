import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import ClubDetail from './pages/ClubDetail'
import Profile from './pages/Profile'
import MyClubs from './pages/MyClubs'

/**
 * 路由权限说明：
 * - 首页 / 社团详情页：公开访问，无需登录（游客可浏览社团介绍与过程性内容）
 * - 个人中心：未登录时页面内提示「请登录」并引导至登录页，不做强制重定向，
 *   这样用户停留在原页面即可看到原因，而不是被无声地弹走。
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/club/:id" element={<ClubDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-clubs" element={<MyClubs />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
