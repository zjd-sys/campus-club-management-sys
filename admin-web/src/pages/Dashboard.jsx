import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Spin, Empty } from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  FileImageOutlined,
  BookOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { getStats } from '../api'

const PIE_PALETTE = [
  '#4096ff',
  '#67c23a',
  '#f56c6c',
  '#fa8c16',
  '#722ed1',
  '#13c2c2',
  '#eb2f96',
  '#a0d911'
]

// 各社团学生占比饼图（conic-gradient 自绘，零依赖）
function ClubPie({ data }) {
  if (!data || !data.length) {
    return <Empty description="暂无社团成员数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) {
    return <Empty description="暂无社团成员数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }
  let acc = 0
  const stops = data
    .map((d) => {
      const start = (acc / total) * 100
      acc += d.value
      const end = (acc / total) * 100
      return `${d.color} ${start}% ${end}%`
    })
    .join(', ')
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: `conic-gradient(${stops})`,
          flex: '0 0 auto'
        }}
      />
      <div style={{ minWidth: 160 }}>
        {data.map((d) => (
          <div
            key={d.name}
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: d.color,
                display: 'inline-block',
                flex: '0 0 auto'
              }}
            />
            <span style={{ color: '#303133' }}>{d.name}</span>
            <span style={{ color: '#909399', marginLeft: 'auto' }}>
              {d.value} 人（{Math.round((d.value / total) * 100)}%）
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// 通用直方图（div 柱状，零依赖）
function Histogram({ data, color = '#4096ff', height = 220 }) {
  if (!data || !data.length) {
    return <Empty description="暂无数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 12,
        height,
        padding: '0 8px',
        overflowX: 'auto'
      }}
    >
      {data.map((d) => (
        <div
          key={d.label}
          style={{
            flex: '1 0 auto',
            minWidth: 40,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end',
            height: '100%'
          }}
        >
          <div style={{ fontSize: 12, color: '#606266', marginBottom: 4 }}>{d.value}</div>
          <div
            title={`${d.label}：${d.value}`}
            style={{
              width: '100%',
              height: `${(d.value / max) * 100}%`,
              background: color,
              borderRadius: '4px 4px 0 0',
              minHeight: d.value > 0 ? 4 : 0
            }}
          />
          <div
            style={{
              fontSize: 12,
              color: '#909399',
              marginTop: 6,
              whiteSpace: 'nowrap',
              transform: 'rotate(-25deg)',
              transformOrigin: 'center top'
            }}
          >
            {d.label}
          </div>
        </div>
      ))}
    </div>
  )
}

// 每日访问趋势：访问次数(pv) + 访客数(uv) 双柱
function VisitBars({ data }) {
  if (!data || !data.length) {
    return <Empty description="暂无访问数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
  }
  const max = Math.max(...data.map((d) => Math.max(d.pv || 0, d.uv || 0)), 1)
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 12,
          height: 240,
          padding: '0 8px',
          overflowX: 'auto'
        }}
      >
        {data.map((d) => (
          <div
            key={d.visitDate ?? d.visitdate}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              minWidth: 34,
              flex: '0 0 auto'
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 170 }}
            >
              <div
                title={`访问 ${d.pv}`}
                style={{
                  width: 14,
                  height: `${(d.pv / max) * 100}%`,
                  background: '#4096ff',
                  borderRadius: 3,
                  minHeight: d.pv > 0 ? 3 : 0
                }}
              />
              <div
                title={`访客 ${d.uv}`}
                style={{
                  width: 14,
                  height: `${(d.uv / max) * 100}%`,
                  background: '#67c23a',
                  borderRadius: 3,
                  minHeight: d.uv > 0 ? 3 : 0
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: '#909399', marginTop: 6 }}>
              {String(d.visitDate ?? d.visitdate).slice(5)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 20, marginTop: 12, color: '#606266', fontSize: 13 }}>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 2,
              background: '#4096ff',
              marginRight: 6
            }}
          />
          每日访问次数（PV）
        </span>
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: 2,
              background: '#67c23a',
              marginRight: 6
            }}
          />
          每日访客数（UV）
        </span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    userCount: 0,
    clubCount: 0,
    materialCount: 0,
    shownMaterial: 0,
    removedMaterial: 0,
    resourceCount: 0,
    clubMemberStats: [],
    visitTrend: [],
    visitDau: 0
  })

  const load = async () => {
    setLoading(true)
    try {
      const data = await getStats()
      setStats({
        userCount: data.userCount || 0,
        clubCount: data.clubCount || 0,
        materialCount: data.materialCount || 0,
        shownMaterial: data.shownMaterial || 0,
        removedMaterial: data.removedMaterial || 0,
        resourceCount: data.resourceCount || 0,
        clubMemberStats: data.clubMemberStats || [],
        visitTrend: data.visitTrend || [],
        visitDau: data.visitDau || 0
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
    { title: '过程性材料', value: stats.shownMaterial, icon: <FileImageOutlined />, color: '#722ed1' },
    { title: '课程资源', value: stats.resourceCount, icon: <BookOutlined />, color: '#fa8c16' },
    // 材料默认直接展示、无需审核，因此改统计「已撤回材料」（不当内容撤展/删除）
    { title: '已撤回材料', value: stats.removedMaterial, icon: <ClockCircleOutlined />, color: '#f56c6c' }
  ]

  const pieData = (stats.clubMemberStats || []).map((d, i) => ({
    name: d.clubName,
    value: d.count || 0,
    color: PIE_PALETTE[i % PIE_PALETTE.length]
  }))
  const barData = (stats.clubMemberStats || []).map((d) => ({
    label: d.clubName,
    value: d.count || 0
  }))
  const totalPv = (stats.visitTrend || []).reduce((s, d) => s + (d.pv || 0), 0)

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

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card className="admin-module" title="各社团学生占比">
              <ClubPie data={pieData} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card className="admin-module" title="各社团学生人数">
              <Histogram data={barData} color="#67c23a" />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={16}>
            <Card className="admin-module" title="每日页面访问趋势（近 14 天）">
              <VisitBars data={stats.visitTrend} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card className="admin-module" title="站点日活量">
              <Statistic
                title="近 14 天去重访问用户数（DAU 累计）"
                value={stats.visitDau}
                suffix="人"
                valueStyle={{ color: '#4096ff' }}
              />
              <div style={{ marginTop: 16 }}>
                <Statistic title="近 14 天总访问次数（PV）" value={totalPv} suffix="次" />
              </div>
              <div style={{ marginTop: 12, color: '#909399', fontSize: 12, lineHeight: 1.6 }}>
                数据来自门户各页面的访问上报，按天聚合；日活量为统计窗口内去重用户数。
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  )
}
