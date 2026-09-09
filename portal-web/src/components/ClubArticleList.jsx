import { Empty } from 'antd'

// 左用户信息 + 右内容，最新置顶（由接口保证顺序）
// item: MaterialVO { id, userName, clubName, description, imageUrl(逗号分隔), videoUrl, submitTime }
export default function ClubArticleList({ items = [] }) {
  if (!items.length) {
    return <Empty description="暂无内容" style={{ padding: 40 }} />
  }

  return (
    <div className="campus-card" style={{ padding: 4 }}>
      {items.map((item) => {
        const images = (item.imageUrl || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
        return (
          <div className="article-row" key={item.id}>
            <div className="article-user">
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: '#4096ff',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  margin: '0 auto 8px'
                }}
              >
                {(item.userName || '?').slice(0, 1)}
              </div>
              <div style={{ fontWeight: 600 }}>{item.userName}</div>
              <div style={{ color: '#909399', fontSize: 12 }}>
                {item.clubName || '社团'}
              </div>
              <div style={{ color: '#c0c4cc', fontSize: 12, marginTop: 4 }}>
                {item.submitTime}
              </div>
            </div>
            <div className="article-content">
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {item.description}
              </div>
              {images.map((src, i) => (
                <img key={i} src={src} alt="material" />
              ))}
              {item.videoUrl && (
                <video src={item.videoUrl} controls style={{ maxWidth: '100%' }} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
