import { useState, useEffect, useCallback } from 'react'
import {
  Carousel,
  Card,
  Spin,
  Empty,
  Button,
  Input,
  Upload,
  Modal,
  Form,
  Table,
  Pagination,
  message,
  Tag,
  Popconfirm,
  Space,
  Divider
} from 'antd'
import {
  InboxOutlined,
  PlusOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/request'
import { isLogin } from '../utils/auth'
import ClubArticleList from '../components/ClubArticleList'

// 过程性材料每页 30 条（需求 4）
const MATERIAL_PAGE_SIZE = 30

// SVG 内含中文，不能用 btoa（仅支持 Latin1，中文会抛 InvalidCharacterError 导致整页白屏），
// 改用 URL 编码形式的 data URI。
const PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="320"><rect width="800" height="320" fill="#e6f0ff"/><text x="50%" y="50%" font-size="22" fill="#4096ff" text-anchor="middle" dominant-baseline="middle" font-family="Microsoft YaHei">社团海报</text></svg>`
  )

const { Dragger } = Upload

export default function ClubDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const logged = isLogin()
  const [club, setClub] = useState(null)
  const [profile, setProfile] = useState(null)
  const [joinedIds, setJoinedIds] = useState([])
  const [loading, setLoading] = useState(true)

  // 过程性材料
  const [materials, setMaterials] = useState([])
  const [matTotal, setMatTotal] = useState(0)
  const [matPage, setMatPage] = useState(1)

  // 课程资源 / 成员
  const [resources, setResources] = useState([])
  const [members, setMembers] = useState([])

  // 材料上传（虚线拖拽框）
  const [fileList, setFileList] = useState([])
  const [uploading, setUploading] = useState(false)

  // 简介编辑
  const [introOpen, setIntroOpen] = useState(false)
  const [introForm] = Form.useForm()
  const [savingIntro, setSavingIntro] = useState(false)

  // 资源发布（教师/管理员）
  const [resOpen, setResOpen] = useState(false)
  const [resForm] = Form.useForm()
  const [resVideo, setResVideo] = useState([])
  const [publishing, setPublishing] = useState(false)

  // 资源编辑 / 撤下 / 删除（仅发布者本人或管理员）
  const [resEditOpen, setResEditOpen] = useState(false)
  const [resEditId, setResEditId] = useState(null)
  const [resEditForm] = Form.useForm()
  const [savingRes, setSavingRes] = useState(false)

  const loadClub = useCallback(() => {
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
  }, [id, logged])

  const loadMaterials = useCallback(
    (page) => {
      api
        .getClubMaterials(id, { page, size: MATERIAL_PAGE_SIZE })
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

  useEffect(() => {
    setLoading(true)
    loadClub()
    loadMaterials(1)
    loadResources()
  }, [id, logged, loadClub, loadMaterials, loadResources])

  // 负责教师 / 管理员才加载成员列表（该接口需管理权限）
  useEffect(() => {
    if (!club || !profile) return
    if (profile.role === 'admin' || club.teacherId === profile.id) {
      loadMembers()
    }
  }, [club, profile, loadMembers])

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

  // ---------- 权限判定 ----------
  const isMember = joinedIds.includes(Number(id)) || (profile && profile.clubId === Number(id))
  const isClubTeacher = !!(profile && club.teacherId === profile.id)
  const isAdmin = !!(profile && profile.role === 'admin')
  const canEditIntro = !!club.canEditIntro
  // 教师或管理员可在社团发布资源；成员可提交过程性材料
  const canUpload = isMember || isClubTeacher || isAdmin

  // 某条材料是否可操作：发布者本人 / 管理员 / 本社团负责教师
  const canManageMaterial = (item) =>
    !!profile &&
    (item.userId === profile.id || isAdmin || isClubTeacher)

  // 海报轮播：社团海报 + 公开材料图片（占屏约二分之一）
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

  // ---------- 材料上传（图片 / 视频 / 文档） ----------
  const handleUpload = () => {
    if (!fileList.length) {
      message.warning('请先选择要上传的图片、视频或文档')
      return
    }
    const fd = new FormData()
    let hasVideo = false
    fileList.forEach((f) => {
      const file = f.originFileObj
      if (!file) return
      const type = file.type || ''
      const name = (file.name || '').toLowerCase()
      if (type.startsWith('image/')) {
        fd.append('images', file)
      } else if (type.startsWith('video/') || /\.(mp4|webm|ogg|mov)$/.test(name)) {
        if (!hasVideo) {
          fd.append('video', file)
          hasVideo = true
        }
      } else {
        fd.append('docs', file)
      }
    })
    setUploading(true)
    api
      .postMaterial(id, fd)
      .then(() => {
        message.success('上传成功，已直接展示')
        setFileList([])
        setMatPage(1)
        loadMaterials(1)
      })
      .catch(() => {})
      .finally(() => setUploading(false))
  }

  // ---------- 材料撤展 / 删除 ----------
  const handleHide = (mid) => {
    api
      .hideMaterial(mid)
      .then(() => {
        message.success('已撤展，材料不再对外展示')
        loadMaterials(matPage)
      })
      .catch(() => {})
  }

  const handleDelete = (mid) => {
    api
      .deleteMaterial(mid)
      .then(() => {
        message.success('已删除')
        loadMaterials(matPage)
      })
      .catch(() => {})
  }

  // ---------- 社团简介编辑 ----------
  const openIntroEdit = () => {
    introForm.setFieldsValue({ intro: club.intro || '' })
    setIntroOpen(true)
  }

  const handleSaveIntro = () => {
    introForm.validateFields().then((values) => {
      setSavingIntro(true)
      api
        .updateClubIntro(id, values.intro || '')
        .then((updated) => {
          message.success('简介已更新')
          setIntroOpen(false)
          setClub(updated && updated.intro !== undefined ? updated : { ...club, intro: values.intro })
        })
        .catch(() => {})
        .finally(() => setSavingIntro(false))
    })
  }

  // ---------- 资源发布（教师 / 管理员） ----------
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

  // ---------- 资源编辑 / 撤下 / 删除（仅发布者本人或管理员） ----------
  const openResEdit = (r) => {
    setResEditId(r.id)
    resEditForm.setFieldsValue({
      title: r.title || '',
      intro: r.intro || '',
      link: r.link || ''
    })
    setResEditOpen(true)
  }

  const handleResEdit = () => {
    resEditForm.validateFields().then((values) => {
      setSavingRes(true)
      api
        .updateResource(resEditId, {
          title: values.title || '',
          intro: values.intro || '',
          link: values.link || ''
        })
        .then(() => {
          message.success('资源已更新')
          setResEditOpen(false)
          loadResources()
        })
        .catch(() => {})
        .finally(() => setSavingRes(false))
    })
  }

  const handleHideResource = (rid) => {
    api
      .hideResource(rid)
      .then(() => {
        message.success('已撤下，资源不再对外展示')
        loadResources()
      })
      .catch(() => {})
  }

  const handleDeleteResource = (rid) => {
    api
      .deleteResource(rid)
      .then(() => {
        message.success('已删除')
        loadResources()
      })
      .catch(() => {})
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

  return (
    <div>
      {/* 顶部：占屏约二分之一的轮播海报 */}
      <Carousel autoplay style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
        {carouselImgs.map((src, i) => (
          <div key={i}>
            <img
              src={src}
              alt="poster"
              style={{
                width: '100%',
                height: '46vh',
                minHeight: 260,
                objectFit: 'cover',
                display: 'block'
              }}
            />
          </div>
        ))}
      </Carousel>

      {/* 中部：负责教师 + 社团简介（可编辑） */}
      <Card className="campus-card" styles={{ body: { padding: 20 } }} style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h2 style={{ margin: '0 0 8px' }}>{club.name}</h2>
            <div style={{ color: '#909399', fontSize: 13, marginBottom: 8 }}>
              负责教师：{club.teacherName || '待分配'}
              {isClubTeacher && <Tag color="blue" style={{ marginLeft: 8 }}>我是负责教师</Tag>}
              {isMember && <Tag color="green" style={{ marginLeft: 8 }}>社团成员</Tag>}
            </div>
          </div>
          {canEditIntro && (
            <Button icon={<EditOutlined />} onClick={openIntroEdit}>
              编辑简介
            </Button>
          )}
        </div>
        <p style={{ color: '#606266', lineHeight: 1.7, margin: 0 }}>
          {club.intro || '暂无简介'}
        </p>
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
        {logged && !canUpload && (
          <div style={{ marginTop: 12, color: '#909399', fontSize: 13 }}>
            加入本社团后即可上传过程性材料
          </div>
        )}
      </Card>

      {/* 下部：材料上传虚线拖拽框（成员 / 负责教师 / 管理员） */}
      {canUpload && (
        <Card className="campus-card" styles={{ body: { padding: 16 } }} style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>上传过程性材料</div>
          <Dragger
            multiple
            fileList={fileList}
            beforeUpload={() => false}
            onChange={({ fileList: fl }) => setFileList(fl)}
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
          >
            <p className="ant-upload-drag-icon">
              <PlusOutlined />
            </p>
            <p className="ant-upload-text">点击或将图片 / 视频 / 文档拖拽到此框内上传</p>
            <p className="ant-upload-hint">支持多份文件；材料无需审核，提交后直接展示</p>
          </Dragger>
          <div style={{ marginTop: 12, textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<InboxOutlined />}
              loading={uploading}
              disabled={!fileList.length}
              onClick={handleUpload}
            >
              提交材料
            </Button>
          </div>
        </Card>
      )}

      {/* 过程性材料区：按时间倒序、每页 30 条、分页折叠、论坛帖式展示 */}
      <Card
        className="campus-card"
        styles={{ body: { padding: 16 } }}
        title="过程性材料"
        style={{ marginBottom: 20 }}
      >
        <ClubArticleList
          items={materials}
          getActions={(item) =>
            canManageMaterial(item) ? (
              <Space>
                <Popconfirm title="确认撤展？撤展后不再对外展示" onConfirm={() => handleHide(item.id)}>
                  <Button size="small" icon={<EyeInvisibleOutlined />}>
                    撤展
                  </Button>
                </Popconfirm>
                <Popconfirm title="确认删除该材料？" onConfirm={() => handleDelete(item.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ) : null
          }
        />
        {matTotal > MATERIAL_PAGE_SIZE && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Pagination
              current={matPage}
              pageSize={MATERIAL_PAGE_SIZE}
              total={matTotal}
              showSizeChanger={false}
              onChange={(p) => {
                setMatPage(p)
                loadMaterials(p)
              }}
            />
          </div>
        )}
      </Card>

      {/* 课程资源：教师或管理员发布，仅本人或管理员可撤下 */}
      {(resources.length > 0 || isClubTeacher || isAdmin) && (
        <Card
          className="campus-card"
          styles={{ body: { padding: 16 } }}
          title="课程资源"
          style={{ marginBottom: 20 }}
          extra={
            (isClubTeacher || isAdmin) && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setResOpen(true)}>
                发布资源
              </Button>
            )
          }
        >
          {resources.length ? (
            <div className="club-grid">
              {resources.map((r) => {
                const mine = !!profile && (r.teacherId === profile.id || isAdmin)
                return (
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
                    {mine && (
                      <Space style={{ marginTop: 8 }} wrap>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => openResEdit(r)}
                        >
                          编辑
                        </Button>
                        <Popconfirm
                          title="确认撤下该资源？撤下后不再对外展示"
                          onConfirm={() => handleHideResource(r.id)}
                        >
                          <Button size="small" icon={<EyeInvisibleOutlined />}>
                            撤下
                          </Button>
                        </Popconfirm>
                        <Popconfirm
                          title="确认删除该资源？"
                          onConfirm={() => handleDeleteResource(r.id)}
                        >
                          <Button size="small" danger icon={<DeleteOutlined />}>
                            删除
                          </Button>
                        </Popconfirm>
                      </Space>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : (
            <Empty description="暂无课程资源" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      )}

      {/* 成员管理（负责教师 / 管理员） */}
      {(isClubTeacher || isAdmin) && (
        <Card className="campus-card" styles={{ body: { padding: 16 } }} title="社团成员">
          <Table
            rowKey="id"
            dataSource={members}
            pagination={false}
            locale={{ emptyText: '暂无成员' }}
            columns={[
              { title: '姓名', dataIndex: 'name' },
              { title: '账号', dataIndex: 'username' },
              { title: '年级', dataIndex: 'gradeName' },
              { title: '班级', dataIndex: 'clazzName' },
              {
                title: '身份',
                dataIndex: 'clubName',
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
          <Divider />
          <div style={{ color: '#909399', fontSize: 12 }}>
            提示：成员列表在首次展开时加载。
          </div>
        </Card>
      )}

      {/* 简介编辑弹窗 */}
      <Modal
        title="编辑社团简介"
        open={introOpen}
        onOk={handleSaveIntro}
        confirmLoading={savingIntro}
        onCancel={() => setIntroOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={introForm} layout="vertical">
          <Form.Item name="intro" label="社团介绍词">
            <Input.TextArea rows={5} placeholder="输入社团介绍词…" maxLength={1000} showCount />
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
              <Button icon={<PlusOutlined />}>选择视频</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* 资源编辑弹窗（仅发布者本人或管理员） */}
      <Modal
        title="编辑课程资源"
        open={resEditOpen}
        onOk={handleResEdit}
        confirmLoading={savingRes}
        onCancel={() => setResEditOpen(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form form={resEditForm} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请填写标题' }]}>
            <Input placeholder="资源标题" />
          </Form.Item>
          <Form.Item name="intro" label="简介">
            <Input.TextArea rows={3} placeholder="资源简介" />
          </Form.Item>
          <Form.Item name="link" label="学习链接">
            <Input placeholder="https://…" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
