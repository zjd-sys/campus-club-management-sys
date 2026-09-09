import axios from 'axios'
import { message } from 'antd'

export const TOKEN_KEY = 'admin_token'
const BASE_URL = 'http://localhost:8080/api/admin'

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// 请求拦截：附加 Bearer token
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
    // 登录等非标准分页接口直接透传
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code === 0) {
        // 标准返回 { code, msg, data }，直接回传 data
        return res.data
      }
      message.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || 'Error'))
    }
    // 后端未包裹 code 时原样返回（如裸数组）
    return res
  },
  (error) => {
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
)

export default request
