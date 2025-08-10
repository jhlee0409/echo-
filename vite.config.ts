import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
  plugins: [react()],
  
  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@store': resolve(__dirname, 'src/store'),
      '@api': resolve(__dirname, 'src/api'),
      '@types': resolve(__dirname, 'src/types'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@lib': resolve(__dirname, 'src/lib'),
      '@services': resolve(__dirname, 'src/services'),
      '@config': resolve(__dirname, 'src/config'),
    },
  },

  // Development server configuration
  server: {
    port: 5173,
    host: true,
    proxy: {
      // Claude API 프록시 (더 구체적인 경로를 먼저 배치)
      '/api/claude': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 환경 변수에서 API 키를 읽어서 헤더에 추가
            const apiKey = env.VITE_CLAUDE_API_KEY
            console.log('🔑 Vite Proxy - API Key check:', {
              exists: !!apiKey,
              prefix: apiKey ? apiKey.slice(0, 12) + '...' : 'MISSING',
              url: req.url,
              method: req.method
            })
            
            if (apiKey && apiKey.startsWith('sk-ant-')) {
              // Claude API 요구 헤더 설정
              proxyReq.setHeader('x-api-key', apiKey) // 소문자로 변경
              proxyReq.setHeader('anthropic-version', '2023-06-01')
              proxyReq.setHeader('content-type', 'application/json')
              console.log('✅ API headers set successfully')
            } else {
              console.error('❌ Invalid or missing Claude API key in proxy')
            }
          })
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('📡 Claude API Response:', {
              status: proxyRes.statusCode,
              statusMessage: proxyRes.statusMessage,
              headers: proxyRes.headers
            })
          })
          
          proxy.on('error', (err, req, res) => {
            console.error('❌ Proxy error:', {
              error: err.message,
              url: req.url,
              method: req.method
            })
          })
        },
      },
      // 기존 백엔드 API 프록시 (일반적인 경로)
      '/api/backend': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/backend/, '/api'),
      },
    },
  },

  // Build configuration
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ai: ['axios'],
          game: ['zustand'],
        },
      },
    },
  },

  // Environment variables
  envPrefix: 'VITE_',

  // Optimizations for AI game
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      'axios',
      'lucide-react',
    ],
  },

  // CSS configuration
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  }
})