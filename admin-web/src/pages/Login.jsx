import { useState } from 'react'
import { Form, Input, Button, Card, message } from 'antd'
import { LockOutlined, UserOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../api'
import { TOKEN_KEY } from '../utils/request'
import { setAdminLevel } from '../utils/auth'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const onFinish = async (values) => {
    setLoading(true)
    try {
      const data = await adminLogin(values)
      // data: { token, role, name, adminLevel }
      if (data.role !== 'admin') {
        message.error('当前账号无管理员权限')
        localStorage.removeItem(TOKEN_KEY)
        return
      }
      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem('admin_role', data.role)
      localStorage.setItem('admin_name', data.name || '管理员')
      localStorage.setItem('admin_id', data.userId || '')
      // 管理员层级（super / normal）：决定是否展示管理员组管理入口，后端会再次校验
      setAdminLevel(data.adminLevel)
      message.success('登录成功')
      navigate('/', { replace: true })
    } catch (e) {
      // 错误信息已在拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card" bordered={false}>
        <div className="login-title">校园社团管理 · 管理后台</div>
        <div className="login-sub">管理员登录（账号 + 密码 + 管理员令牌）</div>
        <Form form={form} onFinish={onFinish} size="large" autoComplete="off">
          <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined />} placeholder="管理员账号" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          <Form.Item name="adminSecret" rules={[{ required: true, message: '请输入管理员密钥' }]}>
            <Input.Password
              prefix={<SafetyCertificateOutlined />}
              placeholder="管理员密钥 (adminSecret)"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登 录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
