import { useState, useEffect } from 'react'
import {
  Card,
  Avatar,
  Descriptions,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tabs,
  Pagination,
  Empty,
  Spin,
  Result,
  message
} from 'antd'
import { EditOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { api } from '../utils/request'
import { isLogin } from '../utils/auth'
import { PAGE_SIZE } from '../theme'
import ClubArticleList from '../components/ClubArticleList'

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [mine, setMine] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [loadingMine, setLoadingMine] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm] = Form.useForm()
  const [saving, setSaving] = useState(false)

  const loadProfile = () => {
    api
      .getProfile()
      .then((data) => setProfile(data))
      .catch(() => {})
  }

  const loadMine = (p, kw) => {
    setLoadingMine(true)
    api
      .getMyMaterials({ page: p, size: PAGE_SIZE, keyword: kw })
      .then((data) => {
        setMine(data.records || [])
        setTotal(data.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoadingMine(false))
  }

  useEffect(() => {
    // 未登录时不请求需鉴权接口，避免触发 401 全局跳转
    if (!isLogin()) return
    loadProfile()
    loadMine(1, '')
  }, [])

  // 未登录：页面内提示「请登录」，不做重定向
  if (!isLogin()) {
    return (
      <Card className="campus-card" styles={{ body: { padding: 24 } }}>
        <Result
          status="info"
          title="请登录"
          subTitle="登录后即可查看个人档案与我提交的过程性材料"
          extra={
            <Button type="primary" onClick={() => navigate('/login')}>
              去登录
            </Button>
          }
        />
      </Card>
    )
  }

  const openEdit = () => {
    editForm.setFieldsValue({
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      gradeId: profile.gradeId,
      clazzId: profile.clazzId
    })
    setEditOpen(true)
  }

  const saveProfile = () => {
    editForm.validateFields().then((values) => {
      setSaving(true)
      api
        .updateProfile({
          name: values.name,
          age: values.age ? Number(values.age) : null,
          gender: values.gender,
          gradeId: values.gradeId ? Number(values.gradeId) : null,
          clazzId: values.clazzId ? Number(values.clazzId) : null
        })
        .then((data) => {
          message.success('已保存')
          setEditOpen(false)
          setProfile(data)
        })
        .catch(() => {})
        .finally(() => setSaving(false))
    })
  }

  const onSearch = (v) => {
    setKeyword(v)
    setPage(1)
    loadMine(1, v)
  }

  if (!profile) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin />
      </div>
    )
  }

  const tabs = [
    {
      key: 'material',
      label: '我的材料',
      children: (
        <div>
          <Input.Search
            placeholder="搜索我的材料"
            allowClear
            onSearch={onSearch}
            style={{ maxWidth: 280, marginBottom: 16 }}
          />
          {loadingMine ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin />
            </div>
          ) : mine.length ? (
            <>
              <ClubArticleList items={mine} />
              {total > PAGE_SIZE && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Pagination
                    current={page}
                    pageSize={PAGE_SIZE}
                    total={total}
                    showSizeChanger={false}
                    onChange={(p) => {
                      setPage(p)
                      loadMine(p, keyword)
                    }}
                  />
                </div>
              )}
            </>
          ) : (
            <Empty description="暂无材料" style={{ padding: 40 }} />
          )}
        </div>
      )
    }
  ]

  return (
    <div>
      <Card
        className="campus-card"
        style={{ marginBottom: 20 }}
        styles={{ body: { padding: 24 } }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Avatar size={72} style={{ backgroundColor: '#4096ff', fontSize: 28 }}>
            {(profile.name || '?').slice(0, 1)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 4px' }}>{profile.name}</h2>
            <div style={{ color: '#909399' }}>
              {profile.role === 'teacher' ? '教师' : '学生'} · @{profile.username}
            </div>
          </div>
          <Button icon={<EditOutlined />} onClick={openEdit}>
            编辑资料
          </Button>
        </div>
        <Descriptions column={3} style={{ marginTop: 20 }} size="middle">
          <Descriptions.Item label="年级">{profile.gradeName || '-'}</Descriptions.Item>
          <Descriptions.Item label="班级">{profile.clazzName || '-'}</Descriptions.Item>
          <Descriptions.Item label="年龄">{profile.age || '-'}</Descriptions.Item>
          <Descriptions.Item label="性别">{profile.gender || '-'}</Descriptions.Item>
          <Descriptions.Item label="所属社团">{profile.clubName || '未加入'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card className="campus-card" styles={{ body: { padding: 16 } }}>
        <Tabs items={tabs} />
      </Card>

      <Modal
        title="编辑个人资料"
        open={editOpen}
        onOk={saveProfile}
        confirmLoading={saving}
        onCancel={() => setEditOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="age" label="年龄">
            <InputNumber min={1} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="gender" label="性别">
            <Select
              options={[
                { value: '男', label: '男' },
                { value: '女', label: '女' }
              ]}
            />
          </Form.Item>
          <Form.Item name="gradeId" label="年级 ID">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="clazzId" label="班级 ID">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
