import { Tag } from 'antd'
import { REVIEW_STATUS, RESOURCE_REVIEW_STATUS, STATUS_TAG } from '../utils/constants'

// 审核状态标签（颜色固定）
export function ReviewStatusTag({ status, resource = false }) {
  const map = resource ? RESOURCE_REVIEW_STATUS : REVIEW_STATUS
  const cfg = map[status] || { color: 'default', text: status }
  return <Tag color={cfg.color}>{cfg.text}</Tag>
}

// 通用状态标签（active/disabled）
export function StatusTag({ status }) {
  const cfg = STATUS_TAG[status] || { color: 'default', text: status }
  return <Tag color={cfg.color}>{cfg.text}</Tag>
}
