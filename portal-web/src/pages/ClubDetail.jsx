import { useState, useEffect, useCallback } from 'react'
import {
  Tabs,
  Carousel,
  Card,
  Spin,
  Empty,
  Button,
  Input,
  Select,
  Upload,
  Modal,
  Form,
  Table,
  Pagination,
  message,
  Tag
} from 'antd'
import {
  InboxOutlined,
  PlusOutlined,
  UploadOutlined,
  VideoCameraOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/request'
import { isLogin } from '../utils/auth'
import { PAGE_SIZE } from '../theme'
import ClubArticleList from '../components/ClubArticleList'

// SVG 内含中文，不能用 btoa（仅支持 Latin1，中文会抛 InvalidCharacterError 导致整页白屏），
// 改用 URL 编码形式的 data URI。
const PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="320"><rect width="800" height="320" fill="#e6f0ff"/><text x="50%" y="50%" font-size="22" fill="#4096ff" text-anchor="middle" dominant-baseline="middle" font-family="Microsoft YaHei">社团海报</text></svg>`
  )

export default function ClubDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const logged = isLogin()
  const [club, setClub] = useState(null)
  const [profile, setProfile] = useState(null)
  const [joinedIds, setJoinedIds] = useState([])
  const [loading, setLoading] = useState(true)

  // 过程性内容
  const [materials, setMaterials] = useState([])
  const [matTotal, setMatTotal] = useState(0)
  const [matPage, setMatPage] = useState(1)

  // 课程资源
  const [resources, setResources] = useState([])
  // 成员
  const [members, setMembers] = useState([])

  // 材料提交弹窗
  const [submitOpen, setSubmitOpen] = useState(false)
  const [submitForm] = Form.useForm()
  const [descImages, setDescImages] = useState([])
  const [descVideo, setDescVideo] = useState([])
  const [submitting, setSubmitting] = useState(false)

  // 资源发布弹窗
  const [resOpen, setResOpen] = useState(false)
  const [resForm] = Form.useForm()
  const [resVideo, setResVideo] = useState([])
  const [publishing, setPublishing] = useState(false)

  // 添加成员弹窗
  const [memOpen, setMemOpen] = useState(false)
  const [memForm] = Form.useForm()

  useEffect(() => {
    setLoading(true)
    // 游客访问时跳过需鉴权接口，只加载公开内容
    Promise.all([
      api.getClub(id).catch(() => null),
      logged ? api.getProfile().catch(() => null) : Promise.resolve(null),
      logged ? api.getJoinedClubs().catch(() => []) : Promise.resolve([])
    ]).then(([c, p, joined]) => {
      setClub(c)
      setProfile(p)
      setJoinedIds((joined || []).map((j) => j.id))
      setLoading(false)
    })
    loadMaterials(1)
    loadResources()
  }, [id, logged])

  const loadMaterials = useCallback(
    (page) => {
      api
        .getClubMaterials(id, { page, size: PAGE_SIZE })
        .then((data) => {
          setMaterials(data.records || [])
          setMatTotal(data.total || 0)
        })
        .catch(() => {})
    },
    [id]
  )

  const loadResources = useCallback(() => {
    api
      .getClubResources(id)
      .then((data) => setResources(data || []))
      .catch(() => {})
  }, [id])

  const loadMembers = useCallback(() => {
    api
      .getClubMembers(id)
      .then((data) => setMembers(data || []))
      .catch(() => {})
  }, [id])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin />
      </div>
    )
  }

  if (!club) {
    return (
      <Card className="campus-card" styles={{ body: { padding: 48 } }}>
        <Empty description="社团不存在或已下架" />
      </Card>
    )
  }

  // 权限判定
  const isMember = joinedIds.includes(Number(id)) || (profile && profile.clubId === Number(id))
  const isTeacher = profile && club.teacherId === profile.id

  // 海报轮播：club.poster + 公开材料图片
  const carouselImgs = [club.poster || PLACEHOLDER]
  materials.forEach((m) => {
    ;(m.imageUrl || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((u) => {
        if (!carouselImgs.includes(u)) carouselImgs.push(u)
      })
  })

  // ---------- 材料提交 ----------
  const handleSubmit = () => {
    submitForm.validateFields().then((values) => {
      setSubmitting(true)
      const fd = new FormData()
      fd.append('description', values.description || '')
      descImages.forEach((f) => fd.append('images', f.originFileObj))
      if (descVideo[0]) fd.append('video', descVideo[0].originFileObj)
      api
        .postMaterial(id, fd)
        .then(() => {
          message.success('提交成功')
          setSubmitOpen(false)
          submitForm.resetFields()
          setDescImages([])
          setDescVideo([])
          loadMaterials(1)
        })
        .catch(() => {})
        .finally(() => setSubmitting(false))
    })
  }

  // ---------- 资源发布 ----------
  const handlePublish = () => {
    resForm.validateFields().then((values) => {
      setPublishing(true)
      const fd = new FormData()
      fd.append('title', values.title || '')
      fd.append('intro', values.intro || '')
      fd.append('link', values.link || '')
      if (resVideo[0]) fd.append('video', resVideo[0].originFileObj)
      api
        .postResource(id, fd)
        .then(() => {
          message.success('发布成功')
          setResOpen(false)
          resForm.resetFields()
          setResVideo([])
          loadResources()
        })
        .catch(() => {})
        .finally(() => setPublishing(false))
    })
  }

  // ---------- 成员管理 ----------
  const handleAddMember = () => {
    memForm.validateFields().then((values) => {
      api
        .addClubMember(id, {
          userId: Number(values.userId),
          identity: values.identity || 'normal'
        })
        .then(() => {
          message.success('已添加')
          setMemOpen(false)
          memForm.resetFields()
          loadMembers()
        })
        .catch(() => {})
    })
  }

  const handleRemoveMember = (userId) => {
    api
      .removeClubMember(id, userId)
      .then(() => {
        message.success('已移除')
        loadMembers()
      })
      .catch(() => {})
  }

  const tabs = [
    {
      key: 'content',
      label: '过程性内容',
      children: (
        <div>
          <ClubArticleList items={materials} />
          {matTotal > PAGE_SIZE && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Pagination
                current={matPage}
                pageSize={PAGE_SIZE}
                total={matTotal}
                showSizeChanger={false}
                onChange={(p) => {
                  setMatPage(p)
                  loadMaterials(p)
                }}
              />
            </div>
          )}
        </div>
      )
    }
  ]

  // 成员或该社团负责教师均可提交材料
  if (isMember || isTeacher) {
    tabs.push({
      key: 'submit',
      label: '材料提交',
      children: (
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setSubmitOpen(true)}
            style={{ marginBottom: 16 }}
          >
            提交材料
          </Button>
          <ClubArticleList items={materials} />
        </div>
      )
    })
  }

  if (resources.length > 0) {
    tabs.push({
      key: 'resource',
      label: '课程资源',
      children: (
        <div>
          {isTeacher && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setResOpen(true)}
              style={{ marginBottom: 16 }}
            >
              发布资源
            </Button>
          )}
          <div className="club-grid">
            {resources.map((r) => (
              <Card key={r.id} className="campus-card" styles={{ body: { padding: 16 } }}>
                <div style={{ fontWeight: 600, fontSize: 16 }}>{r.title}</div>
                <div style={{ color: '#909399', margin: '8px 0', lineHeight: 1.6 }}>
                  {r.intro}
                </div>
                {r.link && (
                  <div style={{ marginBottom: 8 }}>
                    <a href={r.link} target="_blank" rel="noreferrer">
                      学习链接
                    </a>
                  </div>
                )}
                {r.videoUrl && (
                  <video src={r.videoUrl} controls style={{ width: '100%', borderRadius: 6 }} />
                )}
              </Card>
            ))}
          </div>
        </div>
      )
    })
  }

  if (isTeacher) {
    tabs.push({
      key: 'members',
      label: '成员',
      children: (
        <div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setMemOpen(true)}
            style={{ marginBottom: 16 }}
          >
            添加成员
          </Button>
          <Table
            rowKey="id"
            dataSource={members}
            pagination={false}
            columns={[
              { title: '姓名', dataIndex: 'name' },
              { title: '账号', dataIndex: 'username' },
              { title: '年级', dataIndex: 'gradeName' },
              { title: '班级', dataIndex: 'clazzName' },
              {
                title: '身份',
                dataIndex: 'identity',
                render: (v) =>
                  v === 'leader' ? <Tag color="blue">负责人</Tag> : <Tag>普通成员</Tag>
              },
              {
                title: '操作',
                render: (_, rec) => (
                  <Button danger type="link" onClick={() => handleRemoveMember(rec.id)}>
                    移除
                  </Button>
                )
              }
            ]}
          />
        </div>
      )
    })
  }

  return (
    <div>
      <Carousel style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
        {carouselImgs.map((src, i) => (
          <div key={i}>
            <img src={src} alt="poster" style={{ width: '100%', height: 280, objectFit: 'cover', display: 'block' }} />
          </div>
        ))}
      </Carousel>

      <Card className="campus-card" styles={{ body: { padding: 20 } }} style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 8px' }}>{club.name}</h2>
        <p style={{ color: '#606266', lineHeight: 1.7, margin: 0 }}>{club.intro || '暂无简介'}</p>
        {isTeacher && <Tag color="blue" style={{ marginTop: 12 }}>我是负责教师</Tag>}
        {isMember && <Tag color="green" style={{ marginTop: 12 }}>社团成员</Tag>}
        {!logged && (
          <div style={{ marginTop: 12, color: '#909399', fontSize: 13 }}>
            登录后即可加入社团并提交过程性材料
            <Button
              type="link"
              size="small"
              onClick={() => navigate('/login')}
              style={{ paddingLeft: 4 }}
            >
              去登录
            </Button>
          </div>
        )}
      </Card>

      <Card className="campus-card" styles={{ body: { padding: 16 } }}>
        <Tabs items={tabs} />
      </Card>

      {/* 材料提交弹窗 */}
      <Modal
        title="提交材料"
        open={submitOpen}
        onOk={handleSubmit}
        confirmLoading={submitting}
        onCancel={() => setSubmitOpen(false)}
        okText="提交"
        cancelText="取消"
      >
        <Form form={submitForm} layout="vertical">
          <Form.Item name="description" label="文字描述" rules={[{ required: true, message: '请填写描述' }]}>
            <Input.TextArea rows={4} placeholder="分享你的过程性内容…" />
          </Form.Item>
          <Form.Item label="图片">
            <Upload
              listType="picture-card"
              fileList={descImages}
              beforeUpload={() => false}
              onChange={({ fileList }) => setDescImages(fileList)}
            >
              {descImages.length >= 9 ? null : <PlusOutlined />}
            </Upload>
          </Form.Item>
          <Form.Item label="视频">
            <Upload
              beforeUpload={() => false}
              fileList={descVideo}
              maxCount={1}
              accept="video/*"
              onChange={({ fileList }) => setDescVideo(fileList)}
            >
              <Button icon={<VideoCameraOutlined />}>选择视频</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* 资源发布弹窗 */}
      <Modal
        title="发布课程资源"
        open={resOpen}
        onOk={handlePublish}
        confirmLoading={publishing}
        onCancel={() => setResOpen(false)}
        okText="发布"
        cancelText="取消"
      >
        <Form form={resForm} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请填写标题' }]}>
            <Input placeholder="资源标题" />
          </Form.Item>
          <Form.Item name="intro" label="简介">
            <Input.TextArea rows={3} placeholder="资源简介" />
          </Form.Item>
          <Form.Item name="link" label="学习链接">
            <Input placeholder="https://…" />
          </Form.Item>
          <Form.Item label="视频">
            <Upload
              beforeUpload={() => false}
              fileList={resVideo}
              maxCount={1}
              accept="video/*"
              onChange={({ fileList }) => setResVideo(fileList)}
            >
              <Button icon={<UploadOutlined />}>选择视频</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加成员弹窗 */}
      <Modal
        title="添加成员"
        open={memOpen}
        onOk={handleAddMember}
        onCancel={() => setMemOpen(false)}
        okText="添加"
        cancelText="取消"
      >
        <Form form={memForm} layout="vertical">
          <Form.Item name="userId" label="用户 ID" rules={[{ required: true, message: '请输入用户 ID' }]}>
            <Input type="number" placeholder="目标用户 ID" />
          </Form.Item>
          <Form.Item name="identity" label="身份" initialValue="normal">
            <Select
              options={[
                { value: 'normal', label: '普通成员' },
                { value: 'leader', label: '负责人' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
