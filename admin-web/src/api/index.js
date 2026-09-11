import request, { portalRequest } from '../utils/request'

// ===== 认证 =====
export function adminLogin(data) {
  return request.post('/auth/login', data)
}

// ===== 站点配置（系统名称 / Logo / 背景图）=====
export function getSiteConfig() {
  return portalRequest.get('/site-config')
}

// ===== 仪表盘 =====
export function getStats() {
  return request.get('/stats')
}

// ===== 用户 =====
export function getUsers(params) {
  return request.get('/users', { params })
}
export function createUser(data) {
  return request.post('/users', data)
}
export function updateUser(id, data) {
  return request.put(`/users/${id}`, data)
}
export function deleteUser(id) {
  return request.delete(`/users/${id}`)
}

// ===== 社团 =====
export function getClubs(params) {
  return request.get('/clubs', { params })
}
export function createClub(data) {
  return request.post('/clubs', data)
}
export function updateClub(id, data) {
  return request.put(`/clubs/${id}`, data)
}
export function deleteClub(id) {
  return request.delete(`/clubs/${id}`)
}

// 社团成员（仅展示）：走门户命名空间相对路径，不硬编码域名
export function getClubMembers(id) {
  return portalRequest.get(`/clubs/${id}/members`)
}

// ===== 审核 =====
export function getReviewMaterials(params) {
  return request.get('/review/materials', { params })
}
export function reviewMaterial(id, action) {
  return request.post(`/review/materials/${id}`, { action })
}
export function getReviewResources(params) {
  return request.get('/review/resources', { params })
}
export function reviewResource(id, action) {
  return request.post(`/review/resources/${id}`, { action })
}

// ===== 年级班级 =====
export function getGrades() {
  return request.get('/grades')
}
export function createGrade(name) {
  return request.post(`/grades?name=${encodeURIComponent(name)}`)
}
export function deleteGrade(id) {
  return request.delete(`/grades/${id}`)
}
export function getClazzes(gradeId) {
  return request.get('/clazzes', { params: { gradeId } })
}
export function createClazz(gradeId, name) {
  return request.post(`/clazzes?gradeId=${gradeId}&name=${encodeURIComponent(name)}`)
}
export function deleteClazz(id) {
  return request.delete(`/clazzes/${id}`)
}

// ===== 系统设置（系统名称 / Logo / 背景图 / 横幅） =====
export function getSettings() {
  return request.get('/settings')
}
export function updateSettings(data) {
  return request.put('/settings', data)
}
// field: logo | background | banner
export function uploadSettingResource(field, file) {
  const fd = new FormData()
  fd.append('file', file)
  return request.post(`/settings/resource?field=${field}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
export function clearSettingResource(field) {
  return request.delete(`/settings/resource?field=${field}`)
}

// ===== 文件资源管理 =====
export function getFiles() {
  return request.get('/files')
}
export function uploadFile(file, subDir = 'common') {
  const fd = new FormData()
  fd.append('file', file)
  return request.post(`/files/upload?subDir=${encodeURIComponent(subDir)}`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
export function deleteFile(path) {
  return request.delete('/files', { params: { path } })
}

// ===== 管理员组管理（仅超级管理员；普通管理员调用将被后端 403 拦截） =====
export function getMe() {
  return request.get('/me')
}
export function getAdmins() {
  return request.get('/admins')
}
export function createAdmin(data) {
  return request.post('/admins', data)
}
export function resetAdminToken(id) {
  return request.post(`/admins/${id}/token`)
}
// adminLevel: super | normal
export function updateAdminLevel(id, adminLevel) {
  return request.put(`/admins/${id}/level`, { adminLevel })
}
// status: normal | disabled
export function updateAdminStatus(id, status) {
  return request.put(`/admins/${id}/status`, { status })
}
export function deleteAdmin(id) {
  return request.delete(`/admins/${id}`)
}
// 修改自身令牌（所有管理员可用）
export function changeOwnToken(data) {
  return request.put('/me/token', data)
}
