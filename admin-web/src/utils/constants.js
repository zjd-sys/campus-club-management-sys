// 管理端通用常量

// 统一分页大小
export const PAGE_SIZE = 15

// 用户角色（用户管理页只维护师生；管理员由超级管理员在「管理员与令牌」中单独维护，
// 后端也会拒绝通过用户接口创建/修改 admin，避免绕过管理员层级与令牌体系）
export const ROLE_OPTIONS = [
  { label: '学生', value: 'student' },
  { label: '教师', value: 'teacher' }
]

// 管理员层级（super / normal）——用于「管理员与令牌」页
export const ADMIN_LEVEL_OPTIONS = [
  { label: '普通管理员', value: 'normal' },
  { label: '超级管理员', value: 'super' }
]

// 性别
export const GENDER_OPTIONS = [
  { label: '男', value: 'male' },
  { label: '女', value: 'female' }
]

// 社团状态（active / disabled）
export const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '禁用', value: 'disabled' }
]

export const STATUS_TAG = {
  active: { color: 'success', text: '启用' },
  disabled: { color: 'default', text: '禁用' }
}

// 用户状态（normal / disabled）——注意与社团状态取值不同：
// 后端登录校验要求 status === 'normal'，使用 'active' 会导致新建账号无法登录。
export const USER_STATUS_OPTIONS = [
  { label: '正常', value: 'normal' },
  { label: '禁用', value: 'disabled' }
]

export const USER_STATUS_TAG = {
  normal: { color: 'success', text: '正常' },
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
