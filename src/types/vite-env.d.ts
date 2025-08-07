/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLAUDE_API_KEY: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_NODE_ENV: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_MAX_DAILY_MESSAGES: string
  readonly VITE_ENABLE_DEBUG_MODE: string
  readonly VITE_ENABLE_VOICE_CHAT: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_PAYMENT: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_GA_TRACKING_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}