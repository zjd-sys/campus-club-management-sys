import axios from 'axios'
import { message } from 'antd'

export const TOKEN_KEY = 'portal_token'

/**
 * 接口基址：优先构建期环境变量 VITE_API_BASE_URL；
 * 缺省使用「同源相对路径」，开发环境经 Vite 代理转发到后端，
 * 生产环境由反向代理（Nginx 等）按 /api 前缀转发，避免任何硬编码域名 / 端口。
 */
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/portal'

/**
 * 静态文件（图片/视频/文档）基址：默认同源相对路径（经 /files 代理）。
 * 若文件托管在独立域名 / CDN / 对象存储，用 VITE_FILE_BASE_URL 覆盖。
 */
export const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL || ''

/** 将后端返回的资源引用解析为可直接使用的 URL（兼容 data:/http: 与相对路径） */
export function fileUrl(u) {
  if (!u) return ''
  if (/^(https?:|data:|blob:)/i.test(u)) return u
  return FILE_BASE_URL + u
}

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// 请求拦截：注入 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截：统一处理 code / 401
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 文件下载等无 code 包裹场景直接放行
    if (res === undefined || res === null || typeof res.code === 'undefined') {
      return res
    }
    if (res.code !== 0) {
      message.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || 'Error'))
    }
    return res.data
  },
  (error) => {
    const status = error.response && error.response.status
    if (status === 401) {
      // 仅当本地确有 token（即登录态失效）时才提示并跳转；
      // 游客访问公开页面时不应被动辄弹走。
      const hadToken = !!localStorage.getItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_KEY)
      if (hadToken) {
        message.error('登录已失效，请重新登录')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
    const msg =
      (error.response && error.response.data && error.response.data.msg) ||
      error.message ||
      '网络错误'
    message.error(msg)
    return Promise.reject(error)
  }
)

// ---- 业务封装 ----
export const api = {
  // 站点配置（系统名称 / Logo / 背景图；公开接口）
  getSiteConfig: () => request.get('/site-config'),

  // 认证
  login: (data) => request.post('/auth/login', data),
  register: (data) => request.post('/auth/register', data),
  getCaptcha: () => request.get('/captcha/gen'),

  // 个人
  getProfile: () => request.get('/profile'),
  updateProfile: (data) => request.put('/profile', data),
  getMyMaterials: (params) => request.get('/material/mine', { params }),

  // 社团
  getClubs: (params) => request.get('/clubs', { params }),
  getJoinedClubs: () => request.get('/clubs/joined'),
  getClub: (id) => request.get(`/clubs/${id}`),
  getClubMaterials: (id, params) =>
    request.get(`/clubs/${id}/materials`, { params }),
  getClubResources: (id) => request.get(`/clubs/${id}/resources`),
  getClubMembers: (id) => request.get(`/clubs/${id}/members`),
  addClubMember: (id, data) => request.post(`/clubs/${id}/members`, data),
  removeClubMember: (id, userId) =>
    request.delete(`/clubs/${id}/members/${userId}`),

  // 材料提交（multipart）
  postMaterial: (id, formData) =>
    request.post(`/clubs/${id}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // 资源发布（multipart，仅教师）
  postResource: (id, formData) =>
    request.post(`/clubs/${id}/resources`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // 社团介绍词编辑（教师 / 管理员 / 社团负责人）
  updateClubIntro: (id, intro) => request.put(`/clubs/${id}/intro`, { intro }),

  // 材料撤展（保留记录但不再展示）与删除（作者本人 / 管理员 / 负责教师）
  hideMaterial: (id) => request.post(`/materials/${id}/hide`),
  deleteMaterial: (id) => request.delete(`/materials/${id}`),

  // 课程资源：仅发布者本人或管理员可编辑 / 撤下 / 删除
  updateResource: (id, data) => request.put(`/resources/${id}`, data),
  hideResource: (id) => request.post(`/resources/${id}/hide`),
  deleteResource: (id) => request.delete(`/resources/${id}`)
}

export default request
