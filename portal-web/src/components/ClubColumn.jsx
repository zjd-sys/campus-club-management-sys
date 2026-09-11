import { Card } from 'antd'
import { useNavigate } from 'react-router-dom'

// 宽幅社团栏目：与顶部滚动播放栏同宽，海报居左、信息居右，自上而下垂直排列。
// action 为可选的底部操作区（如「加入」按钮），点击 action 不触发整卡跳转。
const PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="180"><rect width="300" height="180" fill="#e6f0ff"/><text x="50%" y="50%" font-size="18" fill="#4096ff" text-anchor="middle" dominant-baseline="middle" font-family="Microsoft YaHei">社团海报</text></svg>`
  )

export default function ClubColumn({ club, action }) {
  const navigate = useNavigate()
  const poster = club.poster || PLACEHOLDER

  return (
    <Card className="club-column" styles={{ body: { padding: 0 } }} hoverable>
      <div
        className="club-column-inner"
        onClick={() => navigate(`/club/${club.id}`)}
      >
        <img className="club-column-poster" src={poster} alt={club.name} />
        <div className="club-column-body">
          <div className="club-column-name">{club.name}</div>
          <div className="club-column-intro">{club.intro || '暂无简介'}</div>
          {action && (
            <div className="club-column-action" onClick={(e) => e.stopPropagation()}>
              {action}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
