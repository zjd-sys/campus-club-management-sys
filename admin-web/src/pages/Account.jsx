import { useEffect, useState } from 'react'
import { Card, Form, Input, Button, Typography, Descriptions, Tag, Alert, Space, message } from 'antd'
import { KeyOutlined, IdcardOutlined, ReloadOutlined } from '@ant-design/icons'
import { getMe, changeOwnToken } from '../api'
import { setAdminLevel, levelLabel, LEVEL_SUPER } from '../utils/auth'

const { Title, Text, Paragraph } = Typography

/**
 * 我的账号：所有管理员可用。
 * 普通管理员在此只能修改自身令牌，无法查看或管理任何其他管理员。
 */
export default function Account() {
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()

  const load = async () => {
    setLoading(true)
    try {
      const data = await getMe()
      setMe(data)
      if (data?.adminLevel) setAdminLevel(data.adminLevel)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onSubmit = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      await changeOwnToken({ oldSecret: values.oldSecret, newSecret: values.newSecret })
      form.resetFields()
      message.success('管理员令牌已修改，请使用新令牌重新登录')
      load()
    } finally {
      setSaving(false)
    }
  }

  const isSuper = me?.adminLevel === LEVEL_SUPER

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>我的账号</Title>
      <Paragraph type="secondary">
        管理员登录采用三重校验：账号 + 密码 + 管理员令牌。令牌是个人凭证，请妥善保管；
        若遗忘，可由超级管理员重置。
      </Paragraph>

      <Card
        title={<Space><IdcardOutlined />账号信息</Space>}
        extra={<Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>}
        style={{ marginBottom: 16 }}
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label="登录账号">{me?.username || '-'}</Descriptions.Item>
          <Descriptions.Item label="姓名 / 备注">{me?.name || '-'}</Descriptions.Item>
          <Descriptions.Item label="账号层级">
            <Tag color={isSuper ? 'red' : 'blue'}>{levelLabel(me?.adminLevel)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="令牌状态">
            {me?.hasOwnSecret ? <Tag color="green">已设置独立令牌</Tag> : <Tag>使用全局缺省令牌</Tag>}
          </Descriptions.Item>
        </Descriptions>
        <Alert
          type={isSuper ? 'warning' : 'info'}
          showIcon
          style={{ marginTop: 8 }}
          message={isSuper ? '你当前是超级管理员' : '你当前是普通管理员'}
          description={
            isSuper
              ? '可管理整个管理员组：新增/删除管理员、提拔或降级、启用或禁用、重置他人令牌。'
              : '普通管理员之间互不可管理：你看不到也改不了其他管理员，只能在此修改自己的令牌。如需调整管理员，请联系超级管理员。'
          }
        />
      </Card>

      <Card title={<Space><KeyOutlined />修改我的令牌</Space>}>
        <Form form={form} layout="vertical" style={{ maxWidth: 480 }}>
          <Form.Item name="oldSecret" label="当前令牌" rules={[{ required: true, message: '请输入当前令牌' }]}>
            <Input.Password placeholder="当前管理员令牌" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="newSecret"
            label="新令牌"
            rules={[{ required: true, min: 6, message: '新令牌至少 6 位' }]}
          >
            <Input.Password placeholder="至少 6 位" autoComplete="off" />
          </Form.Item>
          <Button type="primary" icon={<KeyOutlined />} loading={saving} onClick={onSubmit}>
            修改令牌
          </Button>
        </Form>
        <Text type="secondary">修改后需使用新令牌重新登录管理后台，旧令牌立即失效。</Text>
      </Card>
    </div>
  )
}
