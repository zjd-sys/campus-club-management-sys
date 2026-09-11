import { Empty } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'

// 论坛式过程性材料列表：左用户信息 + 右内容，最新置顶（由接口保证倒序）
// item: MaterialVO { id, userId, userName, clubName, description, imageUrl, videoUrl, docUrl, submitTime }
// getActions(item)：可选，返回每条右下角的操作区（撤展 / 删除），由调用方按权限决定
export default function ClubArticleList({ items = [], getActions }) {
  if (!items.length) {
    return <Empty description="暂无过程性材料" style={{ padding: 40 }} />
  }

  const splitUrls = (v) =>
    (v || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

  return (
    <div className="campus-card" style={{ padding: 4 }}>
      {items.map((item) => {
        const images = splitUrls(item.imageUrl)
        const docs = splitUrls(item.docUrl)
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
              {/* 材料不支持文字叙述，仅在有历史文字时兼容展示 */}
              {item.description ? (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {item.description}
                </div>
              ) : null}

              {images.map((src, i) => (
                <img key={`img-${i}`} src={src} alt="material" />
              ))}

              {item.videoUrl && (
                <video src={item.videoUrl} controls style={{ maxWidth: '100%' }} />
              )}

              {docs.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {docs.map((u, i) => (
                    <div key={`doc-${i}`} style={{ marginBottom: 4 }}>
                      <a href={u} target="_blank" rel="noreferrer" download>
                        <FileTextOutlined style={{ marginRight: 6 }} />
                        文档{docs.length > 1 ? ` ${i + 1}` : ''}（点击查看/下载）
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {getActions ? (
                <div
                  style={{
                    marginTop: 12,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 8
                  }}
                >
                  {getActions(item)}
                </div>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
