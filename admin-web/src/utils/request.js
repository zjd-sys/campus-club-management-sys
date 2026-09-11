import axios from 'axios'
import { message } from 'antd'

export const TOKEN_KEY = 'admin_token'

/**
 * 管理端接口基址：优先环境变量 VITE_ADMIN_API_BASE_URL，缺省同源相对路径 /api/admin。
 * 生产由反向代理按前缀转发，避免硬编码域名 / 端口。
 */
const BASE_URL = import.meta.env.VITE_ADMIN_API_BASE_URL || '/api/admin'

/** 门户端接口基址（管理端少数接口需调用门户命名空间，如社团成员） */
export const PORTAL_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/portal'

/** 静态文件基址：默认同源相对路径（经 /files 代理），可用 VITE_FILE_BASE_URL 指向 CDN/对象存储 */
export const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL || ''

/** 解析后端资源引用为可直接使用的 URL */
export function fileUrl(u) {
  if (!u) return ''
  if (/^(https?:|data:|blob:)/i.test(u)) return u
  return FILE_BASE_URL + u
}

export const ADMIN_NAME_KEY = 'admin_name'
export const ADMIN_ROLE_KEY = 'admin_role'

/** 注入管理端令牌 */
function attachToken(config) {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}

/** 统一响应解包：{ code, msg, data } -> data */
function unwrap(response) {
  const res = response.data
  if (res && typeof res === 'object' && 'code' in res) {
    if (res.code === 0) return res.data
    message.error(res.msg || '请求失败')
    return Promise.reject(new Error(res.msg || 'Error'))
  }
  return res
}

/** 统一异常处理：401 清登录态并跳登录页 */
function handleError(error) {
  if (error.response) {
    const { status } = error.response
    if (status === 401) {
      message.error('登录已失效，请重新登录')
      localStorage.removeItem(TOKEN_KEY)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
    const msg = error.response.data?.msg || error.message || '网络错误'
    message.error(msg)
  } else {
    message.error('网络错误，请检查后端服务')
  }
  return Promise.reject(error)
}

/** 管理端实例 */
const request = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})
request.interceptors.request.use(attachToken, (e) => Promise.reject(e))
request.interceptors.response.use(unwrap, handleError)

/** 门户命名空间实例（管理端调用门户接口时使用，携带同一管理端令牌） */
export const portalRequest = axios.create({
  baseURL: PORTAL_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})
portalRequest.interceptors.request.use(attachToken, (e) => Promise.reject(e))
portalRequest.interceptors.response.use(unwrap, handleError)

export default request
