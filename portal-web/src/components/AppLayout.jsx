import { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Spin } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { api } from '../utils/request'
import { clearToken, isLogin } from '../utils/auth'

const { Header, Content } = Layout

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const [profile, setProfile] = useState(null)
  const [myClubs, setMyClubs] = useState([])
  // Logo 预留：public/logo.png 存在时自动显示，缺失时回落为文字占位
  const [logoOk, setLogoOk] = useState(true)

  const logged = isLogin()

  // 登录态或路由变化时刷新「我的社团」，保证加入/退出社团后导航同步
  useEffect(() => {
    if (!logged) {
      setProfile(null)
      setMyClubs([])
      return
    }
    let alive = true
    api
      .getProfile()
      .then((d) => alive && setProfile(d))
      .catch(() => {})
    api
      .getJoinedClubs()
      .then((arr) => alive && setMyClubs(arr || []))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [logged, location.pathname])

  const handleLogout = () => {
    clearToken()
    setProfile(null)
    setMyClubs([])
    navigate('/')
  }

  // ---------- 导航行为 ----------
  const goMyClubs = () => {
    if (!logged) {
      navigate('/login')
      return
    }
    if (myClubs.length === 1) {
      navigate(`/club/${myClubs[0].id}`)
    } else if (myClubs.length > 1) {
      // 多个社团由 Menu 子菜单展开选择，这里兜底跳第一个
      navigate(`/club/${myClubs[0].id}`)
    } else {
      navigate('/')
    }
  }

  const onMenuClick = ({ key }) => {
    if (key === 'home') navigate('/')
    else if (key === 'myclubs') goMyClubs()
    else if (key.startsWith('club-')) navigate(`/club/${key.slice(5)}`)
  }

  const myClubItems =
    myClubs.length > 1
      ? {
          children: myClubs.map((c) => ({
            key: `club-${c.id}`,
            label: c.name
          }))
        }
      : {}

  const menuItems = [
    { key: 'home', label: '首页' },
    { key: 'myclubs', label: '我的社团', ...myClubItems }
  ]

  // 选中态：首页 → home；位于自己社团页 → myclubs
  const currentClubId = location.pathname.startsWith('/club/')
    ? location.pathname.split('/')[2]
    : null
  const selectedKey = location.pathname === '/' ? 'home' : currentClubId && myClubs.some((c) => String(c.id) === currentClubId) ? 'myclubs' : ''

  const dropdownItems = [
    { key: 'profile', label: '个人中心', onClick: () => navigate('/profile') },
    { key: 'logout', label: '退出登录', onClick: handleLogout, danger: true }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="app-header">
        {/* Logo 预留区（最左） */}
        <div className="app-logo" onClick={() => navigate('/')} title="校园社团">
          {logoOk ? (
            <img
              src="/logo.png"
              alt="logo"
              className="app-logo-img"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <>
              <div className="app-logo-badge">LOGO</div>
              <span className="app-logo-text">校园社团</span>
            </>
          )}
        </div>

        <Menu
          mode="horizontal"
          theme="light"
          selectedKeys={selectedKey ? [selectedKey] : []}
          onClick={onMenuClick}
          items={menuItems}
          style={{ flex: 1, minWidth: 0, borderBottom: 'none', marginLeft: 24 }}
        />

        {/* 右侧：个人中心 / 请登录 */}
        {logged ? (
          <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
            <div className="app-user">
              <Avatar style={{ backgroundColor: '#4096ff' }}>
                {(profile && profile.name ? profile.name : '?').slice(0, 1)}
              </Avatar>
              <span className="app-user-name">
                {profile ? profile.name : <Spin size="small" />}
              </span>
            </div>
          </Dropdown>
        ) : (
          <Button type="link" className="app-login-tip" onClick={() => navigate('/login')}>
            请登录
          </Button>
        )}
      </Header>
      <Content>
        <div className="page-container">
          <Outlet />
        </div>
      </Content>
    </Layout>
  )
}
