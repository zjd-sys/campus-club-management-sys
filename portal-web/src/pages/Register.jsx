import { useState } from 'react'
import { Card, Form, Input, Button, Select, Radio, message } from 'antd'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../utils/request'
import { setToken } from '../utils/auth'

export default function Register() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onFinish = (values) => {
    setLoading(true)
    api
      .register({
        username: values.username,
        password: values.password,
        name: values.name,
        role: values.role, // 'student' | 'teacher'
        gradeId: values.gradeId ? Number(values.gradeId) : null,
        clazzId: values.clazzId ? Number(values.clazzId) : null,
        age: values.age ? Number(values.age) : null,
        gender: values.gender
      })
      .then((data) => {
        setToken(data.token)
        message.success('注册成功')
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
        background: 'linear-gradient(135deg,#e6f0ff 0%,#f5f7fa 100%)',
        padding: 24
      }}
    >
      <Card
        style={{ width: 420, borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        styles={{ body: { padding: 32 } }}
      >
        <h2 style={{ textAlign: 'center', color: '#4096ff', marginBottom: 24 }}>
          注册账号
        </h2>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
            <Input placeholder="登录账号" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="真实姓名" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Radio.Group>
              <Radio.Button value="student">学生</Radio.Button>
              <Radio.Button value="teacher">教师</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="gradeId" label="年级">
            <Input type="number" placeholder="年级 ID（可选）" />
          </Form.Item>
          <Form.Item name="clazzId" label="班级">
            <Input type="number" placeholder="班级 ID（可选）" />
          </Form.Item>
          <Form.Item name="age" label="年龄">
            <Input type="number" placeholder="年龄（可选）" />
          </Form.Item>
          <Form.Item name="gender" label="性别" initialValue="男">
            <Select
              options={[
                { value: '男', label: '男' },
                { value: '女', label: '女' }
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ background: '#4096ff' }}
            >
              注册
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center', color: '#909399' }}>
          已有账号？<Link to="/login">去登录</Link>
        </div>
      </Card>
    </div>
  )
}
