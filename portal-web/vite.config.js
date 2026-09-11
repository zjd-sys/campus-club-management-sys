import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 门户前端：Vite + React 18
// 开发环境通过代理把 /api、/files 转发到后端，前端代码只使用相对路径；
// 目标地址由 VITE_DEV_PROXY_TARGET 配置，默认 http://localhost:8080。
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8080'
  const port = Number(env.VITE_DEV_PORT || 5173)

  return {
    plugins: [react()],
    server: {
      port,
      proxy: {
        '/api': { target, changeOrigin: true },
        // 上传文件（图片/视频/文档）同样转发到后端
        '/files': { target, changeOrigin: true }
      }
    },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1500
    }
  }
})
