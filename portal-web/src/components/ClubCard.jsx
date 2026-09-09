import { Card } from 'antd'
import { useNavigate } from 'react-router-dom'

// 占位海报（当 club.poster 为空时使用）
// 注意：SVG 内含中文，不能用 btoa（仅支持 Latin1，中文会抛 InvalidCharacterError导致整页白屏），
// 改用 URL 编码形式的 data URI。
const PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150"><rect width="300" height="150" fill="#e6f0ff"/><text x="50%" y="50%" font-size="16" fill="#4096ff" text-anchor="middle" dominant-baseline="middle" font-family="Microsoft YaHei">社团海报</text></svg>`
  )

export default function ClubCard({ club }) {
  const navigate = useNavigate()
  const poster = club.poster || PLACEHOLDER

  return (
    <Card
      className="club-card-item"
      styles={{ body: { padding: 14 } }}
      onClick={() => navigate(`/club/${club.id}`)}
    >
      <img className="club-card-poster" src={poster} alt={club.name} />
      <div style={{ fontWeight: 600, fontSize: 16, margin: '12px 0 6px' }}>
        {club.name}
      </div>
      <div
        style={{
          color: '#909399',
          fontSize: 13,
          lineHeight: 1.6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {club.intro || '暂无简介'}
      </div>
    </Card>
  )
}
