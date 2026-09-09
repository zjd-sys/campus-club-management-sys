import { useEffect, useState, useCallback } from 'react'
import { Table, Tabs, Select, Space, Button, Image, Tag, message, Popconfirm } from 'antd'
import { getReviewMaterials, reviewMaterial, getReviewResources, reviewResource } from '../api'
import { ReviewStatusTag } from '../components/ReviewStatusTag'
import { PAGE_SIZE, REVIEW_STATUS_OPTIONS, RESOURCE_REVIEW_STATUS_OPTIONS } from '../utils/constants'

function MaterialTab() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(undefined)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getReviewMaterials({ page, size: PAGE_SIZE, reviewStatus: status })
      setData(res.records || [])
      setTotal(res.total || 0)
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    load()
  }, [load])

  const act = async (id, action) => {
    try {
      await reviewMaterial(id, action)
      message.success('操作成功')
      load()
    } catch (e) {
      // ignore
    }
  }

  const columns = [
    {
      title: '提交人',
      dataIndex: 'userName',
      key: 'userName',
      render: (v) => v || '-'
    },
    { title: '社团', dataIndex: 'clubName', key: 'clubName', render: (v) => v || '-' },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v) => v || '-'
    },
    {
      title: '图片',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (v) => {
        if (!v) return '-'
        const first = v.split(',')[0]
        return <Image src={first} width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4 }} />
      }
    },
    {
      title: '视频',
      dataIndex: 'videoUrl',
      key: 'videoUrl',
      render: (v) =>
        v ? (
          <a href={v} target="_blank" rel="noreferrer">
            查看
          </a>
        ) : (
          '-'
        )
    },
    {
      title: '审核状态',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      render: (s) => <ReviewStatusTag status={s} />
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" onClick={() => act(r.id, 'pass')}>
            通过
          </Button>
          <Button type="link" size="small" danger onClick={() => act(r.id, 'reject')}>
            驳回
          </Button>
          <Popconfirm title="确认下架？" onConfirm={() => act(r.id, 'remove')}>
            <Button type="link" size="small">
              下架
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <>
      <div className="admin-toolbar">
        <Select
          placeholder="按审核状态筛选"
          allowClear
          style={{ width: 160 }}
          options={REVIEW_STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
        />
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          showTotal: (t) => `共 ${t} 条`,
          onChange: setPage
        }}
      />
    </>
  )
}

function ResourceTab() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(undefined)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getReviewResources({ page, size: PAGE_SIZE, reviewStatus: status })
      setData(res.records || [])
      setTotal(res.total || 0)
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => {
    load()
  }, [load])

  const act = async (id, action) => {
    try {
      await reviewResource(id, action)
      message.success('操作成功')
      load()
    } catch (e) {
      // ignore
    }
  }

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    {
      title: '简介',
      dataIndex: 'intro',
      key: 'intro',
      ellipsis: true,
      render: (v) => v || '-'
    },
    {
      title: '链接',
      dataIndex: 'link',
      key: 'link',
      render: (v) =>
        v ? (
          <a href={v} target="_blank" rel="noreferrer">
            打开
          </a>
        ) : (
          '-'
        )
    },
    {
      title: '视频',
      dataIndex: 'videoUrl',
      key: 'videoUrl',
      render: (v) =>
        v ? (
          <a href={v} target="_blank" rel="noreferrer">
            查看
          </a>
        ) : (
          '-'
        )
    },
    {
      title: '审核状态',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      render: (s) => <ReviewStatusTag status={s} resource />
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 140,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" onClick={() => act(r.id, 'pass')}>
            通过
          </Button>
          <Popconfirm title="确认下架？" onConfirm={() => act(r.id, 'remove')}>
            <Button type="link" size="small">
              下架
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <>
      <div className="admin-toolbar">
        <Select
          placeholder="按审核状态筛选"
          allowClear
          style={{ width: 160 }}
          options={RESOURCE_REVIEW_STATUS_OPTIONS}
          value={status}
          onChange={setStatus}
        />
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 900 }}
        pagination={{
          current: page,
          pageSize: PAGE_SIZE,
          total,
          showTotal: (t) => `共 ${t} 条`,
          onChange: setPage
        }}
      />
    </>
  )
}

export default function Review() {
  return (
    <div>
      <div className="admin-module-title">内容审核</div>
      <Tabs
        defaultActiveKey="material"
        items={[
          { key: 'material', label: '过程性材料', children: <MaterialTab /> },
          { key: 'resource', label: '课程资源', children: <ResourceTab /> }
        ]}
      />
    </div>
  )
}
