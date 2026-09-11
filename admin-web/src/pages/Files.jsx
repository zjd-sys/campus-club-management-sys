import { useEffect, useState } from 'react'
import {
  Card, Table, Button, Upload, message, Popconfirm, Image, Space, Tag, Typography, Input, Empty
} from 'antd'
import {
  UploadOutlined, DeleteOutlined, ReloadOutlined, CopyOutlined, FileOutlined
} from '@ant-design/icons'
import { getFiles, uploadFile, deleteFile } from '../api'
import { fileUrl } from '../utils/request'

const { Text, Paragraph, Title } = Typography

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg)$/i

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export default function Files() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [subDir, setSubDir] = useState('common')
  const [keyword, setKeyword] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const list = await getFiles()
      setData(list || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const customRequest = async ({ file, onSuccess, onError }) => {
    try {
      await uploadFile(file, subDir || 'common')
      message.success('上传成功')
      load()
      onSuccess?.({})
    } catch (e) {
      onError?.(e)
    }
  }

  const onDelete = async (record) => {
    await deleteFile(record.path)
    message.success('已删除')
    load()
  }

  const copy = (url) => {
    navigator.clipboard?.writeText(url)
    message.success('已复制资源引用')
  }

  const filtered = data.filter(
    (f) => !keyword || f.name.toLowerCase().includes(keyword.toLowerCase()) || f.path.includes(keyword)
  )

  const columns = [
    {
      title: '预览',
      dataIndex: 'url',
      width: 84,
      render: (url, record) =>
        IMAGE_EXT.test(record.name) ? (
          <Image src={fileUrl(url)} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          <div
            style={{
              width: 48, height: 48, borderRadius: 4, background: '#f5f7fa',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#909399'
            }}
          >
            <FileOutlined />
          </div>
        )
    },
    { title: '文件名', dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: '分组',
      dataIndex: 'group',
      key: 'group',
      width: 110,
      render: (g) => (g ? <Tag>{g}</Tag> : <Tag color="default">根目录</Tag>)
    },
    { title: '大小', dataIndex: 'size', key: 'size', width: 100, render: (s) => formatSize(s) },
    {
      title: '修改时间',
      dataIndex: 'lastModified',
      key: 'lastModified',
      width: 180,
      render: (t) => (t ? String(t).replace('T', ' ').slice(0, 19) : '-')
    },
    {
      title: '资源引用',
      dataIndex: 'url',
      key: 'url',
      width: 260,
      render: (url) => (
        <Space size={4}>
          <Text code style={{ fontSize: 12 }}>{url}</Text>
          <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => copy(url)} />
        </Space>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      render: (_, record) => (
        <Popconfirm title="确认删除该文件？" description="删除后引用该文件的页面将无法显示。" onConfirm={() => onDelete(record)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      )
    }
  ]

  return (
    <div>
      <Title level={4} style={{ marginTop: 0 }}>文件资源</Title>
      <Paragraph type="secondary">
        查看与管理系统全部上传资源（社团海报、过程性材料、课程资源视频、系统品牌图等）。
        资源以相对引用 <Text code>/files/**</Text> 提供，迁移环境后无需改库。
      </Paragraph>

      <Card
        title={`共 ${data.length} 个文件`}
        extra={
          <Space>
            <Input
              placeholder="按文件名 / 路径搜索"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              allowClear
              style={{ width: 200 }}
            />
            <Input
              addonBefore="上传分组"
              value={subDir}
              onChange={(e) => setSubDir(e.target.value)}
              style={{ width: 200 }}
            />
            <Upload showUploadList={false} customRequest={customRequest}>
              <Button type="primary" icon={<UploadOutlined />}>上传文件</Button>
            </Upload>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>
          </Space>
        }
      >
        <Table
          rowKey="path"
          columns={columns}
          dataSource={filtered}
          loading={loading}
          locale={{ emptyText: <Empty description="暂无文件资源（上传后即在此展示）" /> }}
          pagination={{ pageSize: 15, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>
    </div>
  )
}
