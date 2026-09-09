import { useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Button } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  AuditOutlined,
  ApartmentOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { TOKEN_KEY } from '../utils/request'

const { Sider, Header, Content } = Layout

const MENU_ITEMS = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理' },
  { key: '/clubs', icon: <TeamOutlined />, label: '社团管理' },
  { key: '/review', icon: <AuditOutlined />, label: '内容审核' },
  { key: '/structure', icon: <ApartmentOutlined />, label: '年级班级' }
]

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // 选中的菜单：匹配前两段（index 路由为 '/'）
  const selectedKey =
    MENU_ITEMS.find((m) => m.key !== '/' && location.pathname.startsWith(m.key))?.key || '/'

  const adminName = localStorage.getItem('admin_name') || '管理员'

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('admin_name')
    localStorage.removeItem('admin_role')
    navigate('/login', { replace: true })
  }

  const userMenu = {
    items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }],
    onClick: ({ key }) => {
      if (key === 'logout') handleLogout()
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        theme="light"
        width={200}
        style={{ borderRight: '1px solid #e5e7eb' }}
      >
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: '#4096ff',
            fontSize: collapsed ? 14 : 16,
            borderBottom: '1px solid #f0f0f0'
          }}
        >
          {collapsed ? '社团' : '社团管理后台'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={MENU_ITEMS}
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
              <Avatar style={{ backgroundColor: '#4096ff' }} icon={<UserOutlined />} />
              <span>{adminName}</span>
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
