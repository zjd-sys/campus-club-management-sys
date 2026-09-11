/**
 * 管理端身份与层级工具。
 *
 * 层级模型：
 *   - super  超级管理员：可管理整个管理员组（增删管理员 / 设置层级 / 启停 / 重置他人令牌）
 *   - normal 普通管理员：不可查看或管理任何其他管理员，仅能修改自身令牌
 *
 * 层级以后端为准：登录响应携带 adminLevel，进入后台后还会调用 /me 回源刷新，
 * 保证超管被降级后前端菜单立即收敛（后端同时会 403 拦截，前端隐藏只是体验层）。
 */

export const ADMIN_LEVEL_KEY = 'admin_level'
export const LEVEL_SUPER = 'super'
export const LEVEL_NORMAL = 'normal'

/** 本地缓存的层级；缺省按普通管理员处理（更保守），随 /me 回源结果覆盖 */
export function getAdminLevel() {
  return localStorage.getItem(ADMIN_LEVEL_KEY) || LEVEL_NORMAL
}

export function setAdminLevel(level) {
  if (level) localStorage.setItem(ADMIN_LEVEL_KEY, level)
}

export function isSuperAdmin() {
  return getAdminLevel() === LEVEL_SUPER
}

export function levelLabel(level) {
  return level === LEVEL_SUPER ? '超级管理员' : '普通管理员'
}

export function clearAdminIdentity() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_name')
  localStorage.removeItem('admin_role')
  localStorage.removeItem('admin_id')
  localStorage.removeItem(ADMIN_LEVEL_KEY)
}
