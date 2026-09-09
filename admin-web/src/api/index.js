import request from '../utils/request'

// ===== 认证 =====
export function adminLogin(data) {
  return request.post('/auth/login', data)
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

// 社团成员（仅展示）
export function getClubMembers(id) {
  return request.get(`http://localhost:8080/api/portal/clubs/${id}/members`)
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
