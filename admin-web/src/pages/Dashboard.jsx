import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Spin } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  FileImageOutlined,
  BookOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { getStats } from '../api'

export default function Dashboard() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    userCount: 0,
    clubCount: 0,
    materialCount: 0,
    resourceCount: 0,
    pendingMaterial: 0
  })

  const load = async () => {
    setLoading(true)
    try {
      const data = await getStats()
      setStats({
        userCount: data.userCount || 0,
        clubCount: data.clubCount || 0,
        materialCount: data.materialCount || 0,
        resourceCount: data.resourceCount || 0,
        pendingMaterial: data.pendingMaterial || 0
      })
    } catch (e) {
      // 拦截器已处理
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const cards = [
    { title: '用户总数', value: stats.userCount, icon: <UserOutlined />, color: '#4096ff' },
    { title: '社团总数', value: stats.clubCount, icon: <TeamOutlined />, color: '#67c23a' },
    { title: '过程性材料', value: stats.materialCount, icon: <FileImageOutlined />, color: '#722ed1' },
    { title: '课程资源', value: stats.resourceCount, icon: <BookOutlined />, color: '#fa8c16' },
    { title: '待审核材料', value: stats.pendingMaterial, icon: <ClockCircleOutlined />, color: '#f56c6c' }
  ]

  return (
    <div>
      <div className="admin-module-title">数据概览</div>
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {cards.map((c) => (
            <Col xs={24} sm={12} md={8} lg={8} xl={8} key={c.title}>
              <Card className="admin-module" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Statistic title={c.title} value={c.value} />
                  <div
                    style={{
                      fontSize: 28,
                      color: c.color,
                      background: `${c.color}1a`,
                      borderRadius: 4,
                      padding: 10
                    }}
                  >
                    {c.icon}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Spin>
    </div>
  )
}
