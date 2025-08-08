#!/bin/bash

# 소울메이트 AI 컴패니언 게임 개발 환경 설정 스크립트
# Soulmate AI Companion Game Development Setup Script

echo "🚀 소울메이트 프로젝트 초기화 시작..."
echo "🚀 Starting Soulmate project initialization..."

# 프로젝트 생성
echo "📦 Vite + React + TypeScript 프로젝트 생성 중..."
npx create-vite@latest soulmate --template react-ts

cd soulmate

# 기본 의존성 설치
echo "📦 기본 의존성 설치 중..."
npm install

# 추가 의존성 설치
echo "📦 추가 패키지 설치 중..."
npm install \
  zustand \
  axios \
  @types/node \
  lucide-react \
  clsx \
  tailwind-merge

# 개발 의존성 설치
echo "📦 개발 도구 설치 중..."
npm install -D \
  tailwindcss \
  postcss \
  autoprefixer \
  @types/react \
  @types/react-dom \
  eslint \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  prettier \
  prettier-plugin-tailwindcss

# Tailwind CSS 초기화
echo "🎨 Tailwind CSS 설정 중..."
npx tailwindcss init -p

# 폴더 구조 생성
echo "📁 프로젝트 폴더 구조 생성 중..."
mkdir -p src/{components,store,api,types,hooks,utils,assets}
mkdir -p src/components/{ui,game,chat}
mkdir -p src/assets/{images,sounds,icons}
mkdir -p public/{images,sounds}

# 환경 변수 템플릿 생성
echo "⚙️ 환경 변수 템플릿 생성 중..."
cat > .env.example << EOF
# API Keys
VITE_CLAUDE_API_KEY=your_claude_api_key_here

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Development Settings
VITE_NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3000

# Game Configuration
VITE_MAX_DAILY_MESSAGES=50
VITE_ENABLE_DEBUG_MODE=true
EOF

# .env 파일 복사
cp .env.example .env.local

# Git 설정
echo "📝 Git 설정 중..."
git init
cat > .gitignore << EOF
# Dependencies
node_modules/
.pnp
.pnp.js

# Production
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Vercel
.vercel

# Temporary folders
tmp/
temp/
EOF

echo "✅ 개발 환경 설정 완료!"
echo "✅ Development environment setup complete!"
echo ""
echo "🎯 다음 단계:"
echo "1. cd soulmate"
echo "2. .env.local 파일에서 API 키 설정"
echo "3. npm run dev 로 개발 서버 시작"
echo ""
echo "🎯 Next steps:"
echo "1. cd soulmate"
echo "2. Configure API keys in .env.local"
echo "3. Start development server with npm run dev"