import { useState, useEffect } from 'react'
import { Button, Empty, Spin, Result, message } from 'antd'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../utils/request'
import { isLogin } from '../utils/auth'
import ClubColumn from '../components/ClubColumn'

// 「我的社团」页：
// - 未登录 → 引导登录
// - 已登录且无加入社团 → 社团招新页（无横幅、文案更少，各栏目下方带「加入」按钮）
// - 已登录且已加入 → 我的社团列表
export default function MyClubs() {
  const navigate = useNavigate()
  const logged = isLogin()

  const [joined, setJoined] = useState([])
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(false)
  // 记录正在加入中的社团，避免重复点击
  const [joining, setJoining] = useState(null)

  const load = () => {
    if (!logged) return
    setLoading(true)
    Promise.all([
      api.getJoinedClubs().catch(() => []),
      api.getClubs({ page: 1, size: 100 }).then((d) => d.records || []).catch(() => [])
    ])
      .then(([j, a]) => {
        setJoined(j || [])
        setAll(a || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line
  }, [logged])

  const join = async (club) => {
    if (joining) return
    setJoining(club.id)
    try {
      await api.joinClub(club.id)
      message.success(`已加入「${club.name}」`)
      load()
    } catch (e) {
      // 拦截器已提示
    } finally {
      setJoining(null)
    }
  }

  if (!logged) {
    return (
      <Result
        status="403"
        title="请先登录"
        subTitle="登录后即可查看你已加入的社团，或浏览招新并加入心仪的社团。"
        extra={
          <Button type="primary" onClick={() => navigate('/login')}>
            去登录
          </Button>
        }
      />
    )
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin />
      </div>
    )
  }

  // 已加入社团：展示「我的社团」
  if (joined.length > 0) {
    return (
      <div>
        <div className="home-section-head">
          <div>
            <h2 className="home-section-title">我的社团</h2>
            <p className="home-section-desc">
              你已加入 {joined.length} 个社团，点击栏目可查看社团详情、过程性材料与课程资源。
            </p>
          </div>
        </div>
        {joined.map((club) => (
          <ClubColumn
            key={club.id}
            club={club}
            action={
              <Button type="primary" ghost onClick={() => navigate(`/club/${club.id}`)}>
                进入社团
              </Button>
            }
          />
        ))}
      </div>
    )
  }

  // 未加入任何社团：展示「社团招新」页（无横幅、文案精简）
  return (
    <div>
      <div className="home-section-head">
        <div>
          <h2 className="home-section-title">社团招新</h2>
          <p className="home-section-desc">
            你还没有加入任何社团，挑选一个心仪的社团，点击下方「加入」即可成为成员。
          </p>
        </div>
      </div>
      {all.length ? (
        all.map((club) => (
          <ClubColumn
            key={club.id}
            club={club}
            action={
              <Button type="primary" loading={joining === club.id} onClick={() => join(club)}>
                加入
              </Button>
            }
          />
        ))
      ) : (
        <Empty description="暂无社团可加入" style={{ padding: 60 }} />
      )}
    </div>
  )
}
