import { useEffect, useState } from 'react'
import { api } from './request'

/**
 * 站点配置（系统名称 / Logo / 背景图 / 横幅）。
 * 由超管在管理后台「系统设置」维护，门户端通过公开接口读取；
 * 采用进程内缓存 + 并发去重，避免每个页面重复请求。
 */
let cache = null
let pending = null

export function fetchSiteConfig() {
  if (cache) return Promise.resolve(cache)
  if (!pending) {
    pending = api
      .getSiteConfig()
      .then((d) => {
        cache = d || {}
        return cache
      })
      .catch(() => {
        cache = {}
        return cache
      })
  }
  return pending
}

/** 读取站点配置的 Hook，返回 null 表示尚未加载完成（此时应使用默认样式） */
export function useSiteConfig() {
  const [cfg, setCfg] = useState(cache)
  useEffect(() => {
    let alive = true
    fetchSiteConfig().then((c) => {
      if (alive) setCfg(c)
    })
    return () => {
      alive = false
    }
  }, [])
  return cfg
}

/** 解析横幅配置为 URL 数组（英文逗号分隔） */
export function parseBanners(bannerUrl) {
  if (!bannerUrl) return []
  return String(bannerUrl)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
