import { useEffect, useState } from 'react'
import {
  Card, Table, Button, Modal, Form, Input, Space, Tag, message, Typography, Alert, Divider,
  Select, Popconfirm, Tooltip
} from 'antd'
import {
  PlusOutlined, KeyOutlined, SafetyCertificateOutlined, ReloadOutlined, CopyOutlined,
  ArrowUpOutlined, ArrowDownOutlined, StopOutlined, CheckCircleOutlined, DeleteOutlined
} from '@ant-design/icons'
import {
  getAdmins, createAdmin, resetAdminToken, updateAdminLevel, updateAdminStatus, deleteAdmin
} from '../api'
import { LEVEL_SUPER, LEVEL_NORMAL } from '../utils/auth'
import { ADMIN_LEVEL_OPTIONS } from '../utils/constants'

const { Title, Text, Paragraph } = Typography

/** 展示一次性生成的令牌（关闭后不可再查询） */
function TokenResult({ token, account }) {
  if (!token) return null
  return (
    <Alert
      type="warning"
      showIcon
      message={`账号「${account}」的管理员令牌（仅显示一次，请立即保存）`}
      description={
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong copyable={{ icon: <CopyOutlined /> }} style={{ fontSize: 16 }}>{token}</Text>
          <Text type="secondary">
            管理员登录时需同时输入「账号 + 密码 + 管理员令牌」。令牌以密文入库，关闭后无法再次查看，只能重置。
          </Text>
        </Space>
      }
    />
  )
}

function LevelTag({ level }) {
  return level === LEVEL_SUPER
    ? <Tag color="red" icon={<SafetyCertificateOutlined />}>超级管理员</Tag>
    : <Tag color="blue">普通管理员</Tag>
}

export default function Admins() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm] = Form.useForm()
  const [creating, setCreating] = useState(false)
  const [issued, setIssued] = useState(null) // { account, token }

  const currentId = Number(localStorage.getItem('admin_id') || 0)

  const load = async () => {
    setLoading(true)
    try {
      const list = await getAdmins()
      setData(list || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const onCreate = async () => {
    const values = await createForm.validateFields()
    setCreating(true)
    try {
      const res = await createAdmin(values)
      setCreateOpen(false)
      createForm.resetFields()
      setIssued({ account: res.username, token: res.adminSecret })
      load()
    } finally {
      setCreating(false)
    }
  }

  const onReset = async (record) => {
    const res = await resetAdminToken(record.id)
    setIssued({ account: res.username, token: res.adminSecret })
    message.success('令牌已重置')
  }

  const onToggleLevel = async (record) => {
    const next = record.adminLevel === LEVEL_SUPER ? LEVEL_NORMAL : LEVEL_SUPER
    await updateAdminLevel(record.id, next)
    message.success(next === LEVEL_SUPER ? '已提拔为超级管理员' : '已降为普通管理员')
    load()
  }

  const onToggleStatus = async (record) => {
    const next = record.status === 'normal' ? 'disabled' : 'normal'
    await updateAdminStatus(record.id, next)
    message.success(next === 'normal' ? '账号已启用' : '账号已禁用')
    load()
  }

  const onDelete = async (record) => {
    await deleteAdmin(record.id)
    message.success('管理员账号已删除')
    load()
  }

  const columns = [
    { title: '账号', dataIndex: 'username', key: 'username', width: 150 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 130, render: (v) => v || '-' },
    {
      title: '层级',
      dataIndex: 'adminLevel',
      key: 'adminLevel',
      width: 140,
      render: (lv) => <LevelTag level={lv} />
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s) => <Tag color={s === 'normal' ? 'green' : 'default'}>{s === 'normal' ? '正常' : '已禁用'}</Tag>
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      render: (t) => (t ? String(t).replace('T', ' ').slice(0, 19) : '-')
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      render: (_, record) => {
        // 不能操作自己（防止自降级/自禁用/自删除，也避免绕过旧令牌校验重置自身令牌）
        if (record.id === currentId) {
          return <Text type="secondary">当前登录账号（在「我的账号」中修改令牌）</Text>
        }
        return (
          <Space size={4} wrap>
            <Tooltip title="重置该管理员的登录令牌">
              <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => onReset(record)}>
                重置令牌
              </Button>
            </Tooltip>
            <Tooltip title={record.adminLevel === LEVEL_SUPER ? '降为普通管理员' : '提拔为超级管理员'}>
              <Button
                type="link"
                size="small"
                icon={record.adminLevel === LEVEL_SUPER ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                onClick={() => onToggleLevel(record)}
              >
                {record.adminLevel === LEVEL_SUPER ? '降级' : '升为超管'}
              </Button>
            </Tooltip>
            <Button
              type="link"
              size="small"
              icon={record.status === 'normal' ? <StopOutlined /> : <CheckCircleOutlined />}
              onClick={() => onToggleStatus(record)}
            >
              {record.status === 'normal' ? '禁用' : '启用'}
            </Button>
            <Popconfirm title={`确认删除管理员「${record.username}」？`} okText="删除" cancelText="取消" onConfirm={() => onDelete(record)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Space>
        )
      }
    }
  ]

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>管理员与令牌</Title>
      <Paragraph type="secondary">
        仅超级管理员可见。可任命管理员并生成对应的管理员令牌（账号 + 密码 + 令牌三重校验），
        并可调整层级、启用/禁用、重置令牌或删除账号。
      </Paragraph>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="权限边界"
        description="超级管理员可管理整个管理员组；普通管理员彼此之间互不可管理，只能修改自身令牌。系统始终至少保留一名可用的超级管理员，无法把最后一名超管降级、禁用或删除。"
      />

      {issued && (
        <div style={{ marginBottom: 16 }}>
          <TokenResult token={issued.token} account={issued.account} />
        </div>
      )}

      <Card
        title="管理员账号"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              新建管理员
            </Button>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title="新建管理员"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={onCreate}
        confirmLoading={creating}
        okText="创建并生成令牌"
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="创建成功后将生成管理员令牌，仅显示一次。"
        />
        <Form form={createForm} layout="vertical" initialValues={{ adminLevel: LEVEL_NORMAL }}>
          <Form.Item name="username" label="登录账号" rules={[{ required: true, message: '请输入账号' }]}>
            <Input placeholder="如：jwc_admin" autoComplete="off" />
          </Form.Item>
          <Form.Item
            name="password"
            label="登录密码"
            rules={[{ required: true, min: 6, message: '密码至少 6 位' }]}
          >
            <Input.Password placeholder="至少 6 位" autoComplete="off" />
          </Form.Item>
          <Form.Item name="name" label="姓名 / 备注">
            <Input placeholder="如：教务管理员" />
          </Form.Item>
          <Form.Item
            name="adminLevel"
            label="账号层级"
            extra="普通管理员彼此之间互不可管理，只能修改自身令牌"
          >
            <Select
              options={[
                { value: LEVEL_NORMAL, label: '普通管理员（推荐）' },
                { value: LEVEL_SUPER, label: '超级管理员（可管理整个管理员组）' }
              ]}
            />
          </Form.Item>
          <Form.Item
            name="secret"
            label="管理员令牌（留空自动生成）"
            extra="可自定义，至少 6 位；留空则系统生成随机强令牌"
          >
            <Input placeholder="留空自动生成" autoComplete="off" />
          </Form.Item>
        </Form>
      </Modal>

      <Divider />
      <Text type="secondary">
        提示：自身的令牌请在右上角头像「我的账号」中修改（需校验当前令牌）。
      </Text>
    </div>
  )
}
