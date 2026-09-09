import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../utils/request'
import { setToken } from '../utils/auth'

export default function Login() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [captcha, setCaptcha] = useState(null) // {captchaId, image}
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('') // 用户输入的验证码（可选）

  const loadCaptcha = () => {
    api
      .getCaptcha()
      .then((data) => setCaptcha(data))
      .catch(() => {})
  }

  useEffect(() => {
    loadCaptcha()
  }, [])

  const onFinish = (values) => {
    setLoading(true)
    const payload = {
      username: values.username,
      password: values.password
    }
    // 仅当用户填写了验证码，才附带 captchaId + captchaCode
    if (code.trim() && captcha) {
      payload.captchaId = captcha.captchaId
      payload.captchaCode = code.trim()
    }
    api
      .login(payload)
      .then((data) => {
        setToken(data.token)
        message.success('登录成功')
        navigate('/')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#e6f0ff 0%,#f5f7fa 100%)'
      }}
    >
      <Card
        style={{ width: 380, borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        styles={{ body: { padding: 32 } }}
      >
        <h2 style={{ textAlign: 'center', color: '#4096ff', marginBottom: 4 }}>
          校园社团门户
        </h2>
        <p style={{ textAlign: 'center', color: '#909399', marginBottom: 24 }}>
          学生 / 教师登录
        </p>
        <Form form={form} onFinish={onFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入账号' }]}>
            <Input prefix={<UserOutlined />} placeholder="账号" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>
          {captcha && (
            <Form.Item>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Input
                  placeholder="图形验证码（可选）"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  style={{ flex: 1 }}
                />
                <img
                  src={captcha.image}
                  alt="captcha"
                  title="点击刷新"
                  onClick={loadCaptcha}
                  style={{
                    height: 40,
                    borderRadius: 4,
                    cursor: 'pointer',
                    border: '1px solid #eee'
                  }}
                />
              </div>
            </Form.Item>
          )}
          <Form.Item style={{ marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ background: '#4096ff' }}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', color: '#909399' }}>
          还没有账号？<Link to="/register">立即注册</Link>
        </div>
      </Card>
    </div>
  )
}
