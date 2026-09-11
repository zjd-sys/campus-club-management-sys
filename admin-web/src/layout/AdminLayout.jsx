import { useEffect, useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button, Tag } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  AuditOutlined,
  ApartmentOutlined,
  SettingOutlined,
  FolderOpenOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { TOKEN_KEY, fileUrl } from '../utils/request'
import { getSiteConfig, getMe } from '../api'
import { getAdminLevel, setAdminLevel, clearAdminIdentity, LEVEL_SUPER, levelLabel } from '../utils/auth'

const { Sider, Header, Content } = Layout

/** 所有管理员可用的菜单 */
const BASE_MENU_ITEMS = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理' },
  { key: '/clubs', icon: <TeamOutlined />, label: '社团管理' },
  { key: '/review', icon: <AuditOutlined />, label: '内容审核' },
  { key: '/structure', icon: <ApartmentOutlined />, label: '年级班级' }
]

/** 仅超级管理员可用：管理员组管理、系统级配置与全局文件资源 */
const SUPER_MENU_ITEMS = [
  { key: '/admins', icon: <SafetyCertificateOutlined />, label: '管理员与令牌' },
  { key: '/settings', icon: <SettingOutlined />, label: '系统设置' },
  { key: '/files', icon: <FolderOpenOutlined />, label: '文件资源' }
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [site, setSite] = useState({ siteName: '社团管理后台', logoUrl: '' })
  const [level, setLevel] = useState(getAdminLevel())
  const navigate = useNavigate()
  const location = useLocation()

  // 读取站点配置（系统名称 / Logo）+ 回源当前管理员层级
  // 失败时回退默认值，不阻塞后台使用
  useEffect(() => {
    getSiteConfig()
      .then((cfg) => {
        if (cfg) {
          document.title = `${cfg.siteName || '社团管理后台'} · 管理端`
          setSite({ siteName: cfg.siteName || '社团管理后台', logoUrl: cfg.logoUrl || '' })
        }
      })
      .catch(() => {})

    // 层级以后端为准：超管被降级 / 普通管理员被提拔后，菜单即时收敛或放开
    getMe()
      .then((me) => {
        if (me?.adminLevel) {
          setAdminLevel(me.adminLevel)
          setLevel(me.adminLevel)
        }
      })
      .catch(() => {})
  }, [])

  const isSuper = level === LEVEL_SUPER
  // 普通管理员看不到管理员组管理 / 系统设置 / 文件资源（后端同样会 403 拦截）
  const menuItems = isSuper ? [...BASE_MENU_ITEMS, ...SUPER_MENU_ITEMS] : BASE_MENU_ITEMS

  // 选中的菜单：匹配前缀（index 路由为 '/'）
  const selectedKey =
    menuItems.find((m) => m.key !== '/' && location.pathname.startsWith(m.key))?.key || '/'

  const adminName = localStorage.getItem('admin_name') || '管理员'

  const handleLogout = () => {
    clearAdminIdentity()
    navigate('/login', { replace: true })
  }

  const userMenu = {
    items: [
      { key: 'account', icon: <IdcardOutlined />, label: '我的账号' },
      { type: 'divider' },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }
    ],
    onClick: ({ key }) => {
      if (key === 'logout') handleLogout()
      if (key === 'account') navigate('/account')
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        theme="light"
        width={210}
        style={{ borderRight: '1px solid #e5e7eb' }}
      >
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '0 8px',
            borderBottom: '1px solid #f0f0f0',
            overflow: 'hidden'
          }}
        >
          {site.logoUrl ? (
            <img
              src={fileUrl(site.logoUrl)}
              alt="logo"
              style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 4, flex: '0 0 auto' }}
            />
          ) : null}
          {!collapsed && (
            <span
              style={{
                fontWeight: 700,
                color: '#4096ff',
                fontSize: 15,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {site.siteName}
            </span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e5e7eb'
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed((c) => !c)}
          />
          <Dropdown menu={userMenu}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: isSuper ? '#f5222d' : '#4096ff' }} icon={<UserOutlined />} />
              <span>{adminName}</span>
              <Tag color={isSuper ? 'red' : 'blue'} style={{ marginInlineEnd: 0 }}>
                {levelLabel(level)}
              </Tag>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 16, background: '#fff', borderRadius: 4 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
