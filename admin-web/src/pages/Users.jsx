import { useEffect, useState, useCallback } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Popconfirm,
  Tag,
  message
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getGrades,
  getClazzes,
  getClubs
} from '../api'
import {
  PAGE_SIZE,
  ROLE_OPTIONS,
  GENDER_OPTIONS,
  USER_STATUS_OPTIONS,
  USER_STATUS_TAG
} from '../utils/constants'

const emptyForm = {
  username: '',
  password: '',
  name: '',
  role: 'student',
  gradeId: undefined,
  clazzId: undefined,
  age: undefined,
  gender: undefined,
  clubId: undefined,
  status: 'normal'
}

export default function Users() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [roleFilter, setRoleFilter] = useState(undefined)
  const [keyword, setKeyword] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const [grades, setGrades] = useState([])
  const [clazzes, setClazzes] = useState([])
  const [clubs, setClubs] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getUsers({
        page,
        size: PAGE_SIZE,
        role: roleFilter,
        keyword: keyword || undefined
      })
      // res: { total, page, size, records }
      setData(res.records || [])
      setTotal(res.total || 0)
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, keyword])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    getGrades().then((g) => setGrades(g || [])).catch(() => {})
    getClubs({ page: 1, size: 100 }).then((c) => setClubs(c.records || [])).catch(() => {})
  }, [])

  const loadClazzes = (gradeId) => {
    if (!gradeId) {
      setClazzes([])
      return
    }
    getClazzes(gradeId)
      .then((c) => setClazzes(c || []))
      .catch(() => setClazzes([]))
  }

  const openCreate = () => {
    setEditing(null)
    form.setFieldsValue(emptyForm)
    setClazzes([])
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    form.setFieldsValue({
      username: record.username,
      password: '',
      name: record.name,
      role: record.role,
      gradeId: record.gradeId,
      clazzId: record.clazzId,
      age: record.age,
      gender: record.gender,
      clubId: record.clubId,
      status: record.status
    })
    if (record.gradeId) loadClazzes(record.gradeId)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (editing) {
        const payload = { ...values }
        if (!payload.password) delete payload.password
        await updateUser(editing.id, payload)
        message.success('更新成功')
      } else {
        if (!values.password) {
          message.error('新增用户需填写密码')
          setSubmitting(false)
          return
        }
        await createUser(values)
        message.success('创建成功')
      }
      setModalOpen(false)
      load()
    } catch (e) {
      // ignore
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteUser(id)
      message.success('删除成功')
      load()
    } catch (e) {
      // ignore
    }
  }

  const columns = [
    { title: '账号', dataIndex: 'username', key: 'username', width: 120 },
    { title: '姓名', dataIndex: 'name', key: 'name', width: 90 },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 90,
      render: (r) => {
        const cfg = ROLE_OPTIONS.find((o) => o.value === r)
        return <Tag color={r === 'admin' ? 'red' : r === 'teacher' ? 'blue' : 'green'}>{cfg?.label || r}</Tag>
      }
    },
    { title: '年级', dataIndex: 'gradeName', key: 'gradeName', width: 100, render: (v) => v || '-' },
    { title: '班级', dataIndex: 'clazzName', key: 'clazzName', width: 100, render: (v) => v || '-' },
    { title: '年龄', dataIndex: 'age', key: 'age', width: 70, render: (v) => v || '-' },
    { title: '性别', dataIndex: 'gender', key: 'gender', width: 70, render: (v) => (v === 'male' ? '男' : v === 'female' ? '女' : '-') },
    { title: '所属社团', dataIndex: 'clubName', key: 'clubName', width: 140, render: (v) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s) => {
        const cfg = USER_STATUS_TAG[s] || { color: 'default', text: s }
        return <Tag color={cfg.color}>{cfg.text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该用户？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="admin-module-title">用户管理</div>
      <div className="admin-toolbar">
        <Select
          placeholder="按角色筛选"
          allowClear
          style={{ width: 160 }}
          options={ROLE_OPTIONS}
          value={roleFilter}
          onChange={setRoleFilter}
        />
        <Input.Search
          placeholder="账号/姓名关键词"
          allowClear
          style={{ width: 220 }}
          onSearch={setKeyword}
          onChange={(e) => {
            if (!e.target.value) setKeyword('')
          }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增用户
        </Button>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          showTotal: (t) => `共 ${t} 条`,
          onChange: setPage
        }}
      />

      <Modal
        title={editing ? '编辑用户' : '新增用户'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" initialValues={emptyForm}>
          <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
            <Input placeholder="登录账号" disabled={!!editing} />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={editing ? [] : [{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder={editing ? '留空则不修改' : '登录密码'} />
          </Form.Item>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="真实姓名" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
          <Form.Item name="gradeId" label="年级">
            <Select
              placeholder="选择年级"
              allowClear
              options={grades.map((g) => ({ label: g.name, value: g.id }))}
              onChange={(v) => {
                form.setFieldValue('clazzId', undefined)
                loadClazzes(v)
              }}
            />
          </Form.Item>
          <Form.Item name="clazzId" label="班级">
            <Select
              placeholder="选择班级"
              allowClear
              options={clazzes.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>
          <Form.Item name="age" label="年龄">
            <InputNumber min={0} max={120} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select placeholder="选择性别" allowClear options={GENDER_OPTIONS} />
          </Form.Item>
          <Form.Item name="clubId" label="所属社团">
            <Select
              placeholder="选择社团"
              allowClear
              options={clubs.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={USER_STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
