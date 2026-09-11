import { useEffect, useState, useCallback } from 'react'
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Drawer,
  List,
  Avatar,
  Popconfirm,
  Image,
  Upload,
  message,
  Tag
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, TeamOutlined, UploadOutlined
} from '@ant-design/icons'
import {
  getClubs, createClub, updateClub, deleteClub, getClubMembers, getUsers, uploadFile
} from '../api'
import { fileUrl } from '../utils/request'
import { PAGE_SIZE, STATUS_OPTIONS, STATUS_TAG } from '../utils/constants'

const emptyForm = {
  name: '',
  intro: '',
  poster: '',
  teacherId: undefined,
  status: 'active'
}

export default function Clubs() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const [teachers, setTeachers] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [members, setMembers] = useState([])
  const [memberLoading, setMemberLoading] = useState(false)
  const [currentClub, setCurrentClub] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getClubs({ page, size: PAGE_SIZE })
      setData(res.records || [])
      setTotal(res.total || 0)
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    getUsers({ page: 1, size: 200, role: 'teacher' })
      .then((u) => setTeachers(u.records || []))
      .catch(() => {})
  }, [])

  const openCreate = () => {
    setEditing(null)
    form.setFieldsValue(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (record) => {
    setEditing(record)
    form.setFieldsValue({
      name: record.name,
      intro: record.intro,
      poster: record.poster,
      teacherId: record.teacherId,
      status: record.status
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (editing) {
        await updateClub(editing.id, values)
        message.success('更新成功')
      } else {
        await createClub(values)
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
      await deleteClub(id)
      message.success('删除成功')
      load()
    } catch (e) {
      // ignore
    }
  }

  const openMembers = async (record) => {
    setCurrentClub(record)
    setDrawerOpen(true)
    setMemberLoading(true)
    try {
      const list = await getClubMembers(record.id)
      setMembers(list || [])
    } catch (e) {
      setMembers([])
    } finally {
      setMemberLoading(false)
    }
  }

  const columns = [
    {
      title: '海报',
      dataIndex: 'poster',
      key: 'poster',
      width: 80,
      render: (v) =>
        v ? (
          <Image src={fileUrl(v)} width={56} height={56} style={{ objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <Avatar shape="square" size={56}>
            社
          </Avatar>
        )
    },
    { title: '名称', dataIndex: 'name', key: 'name', width: 140 },
    { title: '简介', dataIndex: 'intro', key: 'intro', ellipsis: true, render: (v) => v || '-' },
    {
      title: '负责教师',
      dataIndex: 'teacherId',
      key: 'teacherId',
      width: 120,
      render: (id) => teachers.find((t) => t.id === id)?.name || id || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s) => {
        const cfg = STATUS_TAG[s] || { color: 'default', text: s }
        return <Tag color={cfg.color}>{cfg.text}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<TeamOutlined />}
            onClick={() => openMembers(record)}
          >
            成员
          </Button>
          <Popconfirm title="确认删除该社团？" onConfirm={() => handleDelete(record.id)}>
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
      <div className="admin-module-title">社团管理</div>
      <div className="admin-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增社团
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
        title={editing ? '编辑社团' : '新增社团'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" initialValues={emptyForm}>
          <Form.Item name="name" label="社团名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="社团名称" />
          </Form.Item>
          <Form.Item name="intro" label="简介">
            <Input.TextArea rows={3} placeholder="社团简介" />
          </Form.Item>
          <Form.Item label="社团海报" extra="可直接上传图片，或填写资源引用 / 外部 URL">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="poster" noStyle>
                <Input placeholder="/files/... 或 https://..." />
              </Form.Item>
              <Upload
                showUploadList={false}
                customRequest={async ({ file, onSuccess, onError }) => {
                  try {
                    const res = await uploadFile(file, 'posters')
                    form.setFieldValue('poster', res?.url || '')
                    message.success('海报已上传')
                    onSuccess?.({})
                  } catch (e) {
                    onError?.(e)
                  }
                }}
              >
                <Button icon={<UploadOutlined />}>上传</Button>
              </Upload>
            </Space.Compact>
          </Form.Item>
          <Form.Item name="teacherId" label="负责教师">
            <Select
              placeholder="选择负责教师"
              allowClear
              showSearch
              optionFilterProp="label"
              options={teachers.map((t) => ({ label: `${t.name}（${t.username}）`, value: t.id }))}
            />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={currentClub ? `「${currentClub.name}」成员` : '社团成员'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
      >
        <List
          loading={memberLoading}
          dataSource={members}
          locale={{ emptyText: '暂无成员' }}
          renderItem={(m) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar>{m.name?.[0] || 'U'}</Avatar>}
                title={m.name}
                description={
                  <Space size={4}>
                    <Tag>{m.role === 'teacher' ? '教师' : '学生'}</Tag>
                    <span>{m.gradeName || ''}</span>
                    <span>{m.clazzName || ''}</span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  )
}
