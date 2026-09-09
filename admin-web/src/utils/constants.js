// 管理端通用常量

// 统一分页大小
export const PAGE_SIZE = 15

// 用户角色
export const ROLE_OPTIONS = [
  { label: '学生', value: 'student' },
  { label: '教师', value: 'teacher' },
  { label: '管理员', value: 'admin' }
]

// 性别
export const GENDER_OPTIONS = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' }
]

// 通用状态（用户/社团）
export const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '禁用', value: 'disabled' }
]

export const STATUS_TAG = {
  active: { color: 'success', text: '启用' },
  disabled: { color: 'default', text: '禁用' }
}

// 审核状态（固定颜色）
export const REVIEW_STATUS = {
  pending: { color: 'gold', text: '待审核' },
  passed: { color: 'success', text: '通过' },
  rejected: { color: 'error', text: '驳回' },
  removed: { color: 'default', text: '下架' }
}

export const REVIEW_STATUS_OPTIONS = [
  { label: '待审核', value: 'pending' },
  { label: '通过', value: 'passed' },
  { label: '驳回', value: 'rejected' },
  { label: '下架', value: 'removed' }
]

// 资源审核状态（仅 pending/passed/removed）
export const RESOURCE_REVIEW_STATUS = {
  pending: { color: 'gold', text: '待审核' },
  passed: { color: 'success', text: '通过' },
  removed: { color: 'default', text: '下架' }
}

export const RESOURCE_REVIEW_STATUS_OPTIONS = [
  { label: '待审核', value: 'pending' },
  { label: '通过', value: 'passed' },
  { label: '下架', value: 'removed' }
]
