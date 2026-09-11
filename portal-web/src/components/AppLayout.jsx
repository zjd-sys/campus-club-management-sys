import { useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Spin } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { api, fileUrl } from '../utils/request'
import { clearToken, isLogin } from '../utils/auth'
import { useSiteConfig } from '../utils/site'

const { Header, Content } = Layout

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const [profile, setProfile] = useState(null)
  const [myClubs, setMyClubs] = useState([])
  // 站点配置（系统名称 / Logo）由管理后台维护
  const site = useSiteConfig()
  // Logo 加载失败时回落为文字占位
  const [logoOk, setLogoOk] = useState(true)

  const logged = isLogin()

  // Logo 地址：优先使用后台配置，缺省回落 public/logo.png，再失败则显示文字占位
  const logoSrc = site?.logoUrl ? fileUrl(site.logoUrl) : '/logo.png'
  // 切换 Logo 地址时重置加载状态，避免先前的 404 影响配置生效
  useEffect(() => {
    setLogoOk(true)
  }, [logoSrc])

  // 系统名称同步为浏览器标题
  useEffect(() => {
    if (site?.siteName) document.title = site.siteName
  }, [site])

  // 全站背景图（后台可配置），未配置时沿用主题默认底色
  const contentStyle = site?.backgroundUrl
    ? {
        backgroundImage: `url(${fileUrl(site.backgroundUrl)})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }
    : undefined

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

  // 页面访问埋点：路由变化时上报一次（公开接口，游客亦可计数）
  useEffect(() => {
    api.recordVisit(location.pathname).catch(() => {})
    // eslint-disable-next-line
  }, [location.pathname])

  // ---------- 导航行为 ----------
  const onMenuClick = ({ key }) => {
    if (key === 'home') navigate('/')
    else if (key === 'myclubs') navigate('/my-clubs')
  }

  const menuItems = [
    { key: 'home', label: '首页' },
    { key: 'myclubs', label: '我的社团' }
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
        <div className="app-logo" onClick={() => navigate('/')} title={site?.siteName || '校园社团'}>
          {logoOk ? (
            <img
              src={logoSrc}
              alt="logo"
              className="app-logo-img"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <>
              <div className="app-logo-badge">LOGO</div>
              <span className="app-logo-text">{site?.siteName || '校园社团'}</span>
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
      <Content style={contentStyle}>
        <div className="page-container">
          <Outlet />
        </div>
      </Content>
    </Layout>
  )
}
