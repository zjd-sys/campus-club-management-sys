import { useState, useEffect } from 'react'
import { Carousel, Segmented, Input, Pagination, Empty, Spin } from 'antd'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { api } from '../utils/request'
import { isLogin } from '../utils/auth'
import { PAGE_SIZE } from '../theme'
import ClubCard from '../components/ClubCard'

const BANNERS = [
  {
    title: '多彩社团，点亮校园',
    bg: 'linear-gradient(135deg,#4096ff,#67c23a)'
  },
  {
    title: '文学社 · 以文会友',
    bg: 'linear-gradient(135deg,#67c23a,#4096ff)'
  },
  {
    title: '加入我们，遇见更好的自己',
    bg: 'linear-gradient(135deg,#f56c6c,#e6a23c)'
  }
]

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const logged = isLogin()
  // 未登录时忽略 joined 视图，避免请求需鉴权接口触发 401 跳转
  const view = searchParams.get('view') === 'joined' && logged ? 'joined' : 'all'

  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchClubs = (view, page, keyword) => {
    setLoading(true)
    const p =
      view === 'joined'
        ? api.getJoinedClubs().then((arr) => ({ records: arr, total: arr.length }))
        : api
            .getClubs({ page, size: PAGE_SIZE, keyword })
            .then((data) => ({ records: data.records, total: data.total }))
    p.then(({ records, total }) => {
      setList(records || [])
      setTotal(total || 0)
    })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    setPage(1)
    fetchClubs(view, 1, keyword)
    // eslint-disable-next-line
  }, [view])

  const onSearch = (v) => {
    setKeyword(v)
    setPage(1)
    fetchClubs(view, 1, v)
  }

  const onPageChange = (p) => {
    setPage(p)
    fetchClubs(view, p, keyword)
  }

  const onViewChange = (val) => {
    if (val === 'joined') {
      if (!logged) {
        navigate('/login')
        return
      }
      setSearchParams({ view: 'joined' })
    } else {
      setSearchParams({})
    }
  }

  return (
    <div>
      <Carousel autoplay style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
        {BANNERS.map((b, i) => (
          <div key={i}>
            <div
              style={{
                height: 220,
                background: b.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 28,
                fontWeight: 700
              }}
            >
              {b.title}
            </div>
          </div>
        ))}
      </Carousel>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12
        }}
      >
        <Segmented
          value={view}
          onChange={onViewChange}
          options={[
            { label: '全校社团', value: 'all' },
            { label: '我的社团', value: 'joined' }
          ]}
        />
        <Input.Search
          placeholder="搜索社团"
          allowClear
          onSearch={onSearch}
          style={{ width: 260 }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin />
        </div>
      ) : list.length ? (
        <>
          <div className="club-grid">
            {list.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
          {view === 'all' && total > PAGE_SIZE && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={total}
                onChange={onPageChange}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      ) : (
        <Empty description="暂无社团" style={{ padding: 60 }} />
      )}
    </div>
  )
}
