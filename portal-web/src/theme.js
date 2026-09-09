// 高中校园风主题配置
export const themeConfig = {
  token: {
    colorPrimary: '#4096ff',
    colorSuccess: '#67c23a',
    colorError: '#f56c6c',
    colorWarning: '#e6a23c',
    borderRadius: 8,
    fontFamily:
      '"Microsoft YaHei", "微软雅黑", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    colorBgLayout: '#f5f7fa'
  },
  components: {
    Card: {
      colorBgContainer: '#ffffff',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
    },
    Layout: {
      bodyBg: '#f5f7fa',
      headerBg: '#ffffff',
      headerHeight: 60
    }
  }
}

// 全局颜色常量，供组件按需引用
export const COLORS = {
  primary: '#4096ff',
  success: '#67c23a',
  error: '#f56c6c',
  bg: '#f5f7fa',
  card: '#ffffff'
}

// 分页固定参数
export const PAGE_SIZE = 15
