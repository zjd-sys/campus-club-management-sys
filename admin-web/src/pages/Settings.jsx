import { useEffect, useState } from 'react'
import {
  Card, Form, Input, Button, Upload, message, Divider, Typography, Space, Row, Col, Empty
} from 'antd'
import { UploadOutlined, SaveOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  getSettings, updateSettings, uploadSettingResource, clearSettingResource
} from '../api'
import { fileUrl } from '../utils/request'

const { Title, Text, Paragraph } = Typography

/** 单项资源（Logo / 背景图 / 横幅）展示 + 上传替换 + 清除 */
function ResourceField({ label, hint, field, value, onChanged, previewHeight = 120 }) {
  const [uploading, setUploading] = useState(false)

  const customRequest = async ({ file, onSuccess, onError }) => {
    setUploading(true)
    try {
      await uploadSettingResource(field, file)
      message.success(`${label}已更新`)
      onChanged()
      onSuccess?.({})
    } catch (e) {
      onError?.(e)
    } finally {
      setUploading(false)
    }
  }

  const clear = async () => {
    await clearSettingResource(field)
    message.success(`${label}已清除`)
    onChanged()
  }

  return (
    <Card size="small" title={label} style={{ height: '100%' }}>
      <Paragraph type="secondary" style={{ marginBottom: 12 }}>{hint}</Paragraph>
      {value ? (
        <div
          style={{
            border: '1px solid #f0f0f0',
            borderRadius: 6,
            padding: 8,
            background: '#fafafa',
            textAlign: 'center'
          }}
        >
          <img
            src={fileUrl(value)}
            alt={label}
            style={{ maxWidth: '100%', maxHeight: previewHeight, objectFit: 'contain' }}
          />
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未设置（使用系统默认样式）" />
      )}
      <Space style={{ marginTop: 12 }}>
        <Upload showUploadList={false} customRequest={customRequest}>
          <Button icon={<UploadOutlined />} loading={uploading}>上传替换</Button>
        </Upload>
        <Button icon={<DeleteOutlined />} disabled={!value} onClick={clear}>清除</Button>
      </Space>
    </Card>
  )
}

export default function Settings() {
  const [form] = Form.useForm()
  const [cfg, setCfg] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await getSettings()
      setCfg(data || {})
      form.setFieldsValue({
        siteName: data?.siteName,
        subTitle: data?.subTitle,
        themeColor: data?.themeColor,
        footerText: data?.footerText
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      await updateSettings(values)
      message.success('系统配置已保存')
      load()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>系统设置</Title>
      <Paragraph type="secondary">
        配置系统名称、Logo、背景图与横幅等品牌信息。资源引用以相对路径保存，可随系统一起迁移，
        不使用任何与本机环境绑定的绝对路径。
      </Paragraph>

      <Card
        title="基础信息"
        extra={<Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>}
        style={{ marginBottom: 16 }}
      >
        <Form form={form} layout="vertical" style={{ maxWidth: 640 }}>
          <Form.Item name="siteName" label="系统名称" rules={[{ required: true, message: '请输入系统名称' }]}>
            <Input placeholder="如：校园社团管理系统" maxLength={64} />
          </Form.Item>
          <Form.Item name="subTitle" label="副标题 / 一句话简介">
            <Input placeholder="如：发现社团 · 加入社团 · 记录成长" maxLength={120} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="themeColor" label="主题色（十六进制）">
                <Input placeholder="#4096ff" maxLength={16} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="footerText" label="页脚文案">
                <Input placeholder="如：校园社团综合管理系统" maxLength={200} />
              </Form.Item>
            </Col>
          </Row>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={onSave}>
            保存基础信息
          </Button>
        </Form>
      </Card>

      <Divider orientation="left">品牌资源</Divider>
      <Row gutter={16}>
        <Col xs={24} md={8}>
          <ResourceField
            label="系统 Logo"
            hint="显示于门户导航栏与管理后台左上角。建议正方形，支持 PNG/JPG/SVG。"
            field="logo"
            value={cfg?.logoUrl}
            onChanged={load}
          />
        </Col>
        <Col xs={24} md={8}>
          <ResourceField
            label="全站背景图"
            hint="作为门户页面底图/主视觉背景，留空则使用系统默认渐变。"
            field="background"
            value={cfg?.backgroundUrl}
            onChanged={load}
          />
        </Col>
        <Col xs={24} md={8}>
          <ResourceField
            label="首页横幅"
            hint="首页顶部横幅/轮播主图；多张可用英文逗号分隔。"
            field="banner"
            value={cfg?.bannerUrl}
            onChanged={load}
          />
        </Col>
      </Row>

      <Card size="small" style={{ marginTop: 16 }}>
        <Space direction="vertical" size={2}>
          <Text type="secondary">上传的文件统一存放于后端存储目录（默认 ./uploads），以 /files/** 相对引用对外提供。</Text>
          <Text type="secondary">部署到不同环境时无需修改代码：切换目录用 STORAGE_LOCAL_PATH，切换对象存储用 STORAGE_TYPE=minio。</Text>
        </Space>
      </Card>
    </div>
  )
}
