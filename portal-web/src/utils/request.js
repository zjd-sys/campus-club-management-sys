import axios from 'axios'
import { message } from 'antd'

export const TOKEN_KEY = 'portal_token'
export const BASE_URL = 'http://localhost:8080/api/portal'

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
    })
}

export default request
