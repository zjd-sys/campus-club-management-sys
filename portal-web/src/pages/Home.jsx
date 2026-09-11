import { useState, useEffect } from 'react'
import { Carousel, Input, Pagination, Empty, Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import { api, fileUrl } from '../utils/request'
import { PAGE_SIZE } from '../theme'
import { useSiteConfig, parseBanners } from '../utils/site'
import ClubColumn from '../components/ClubColumn'

const DEFAULT_BANNERS = [
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
  const navigate = useNavigate()
  const site = useSiteConfig()
  // 后台可配置首页横幅；未配置时使用默认渐变文案轮播
  const bannerUrls = parseBanners(site?.bannerUrl)
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchClubs = (p, kw) => {
    setLoading(true)
    api
      .getClubs({ page: p, size: PAGE_SIZE, keyword: kw || undefined })
      .then((data) => {
        setList(data.records || [])
        setTotal(data.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchClubs(1, '')
    // eslint-disable-next-line
  }, [])

  const onSearch = (v) => {
    setKeyword(v)
    setPage(1)
    fetchClubs(1, v)
  }

  const onPageChange = (p) => {
    setPage(p)
    fetchClubs(p, keyword)
  }

  return (
    <div>
      <Carousel autoplay style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
        {bannerUrls.length
          ? bannerUrls.map((url, i) => (
              <div key={i}>
                <img
                  src={fileUrl(url)}
                  alt={`banner-${i}`}
                  style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
                />
              </div>
            ))
          : DEFAULT_BANNERS.map((b, i) => (
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

      <div className="home-section-head">
        <div>
          <h2 className="home-section-title">社团一览</h2>
          <p className="home-section-desc">
            这里集中展示学校各类社团的风采，涵盖学术、文艺、体育、公益等方向。目前共有 {total} 个社团正在招新，点击栏目即可查看详情并了解入社方式。
          </p>
        </div>
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
          {list.map((club) => (
            <ClubColumn key={club.id} club={club} />
          ))}
          {total > PAGE_SIZE && (
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
