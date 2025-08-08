# 🤖 소울메이트 (Soulmate) - AI 컴패니언 RPG

> AI 기반 동반자와 함께하는 감정적 유대감 게임  
> An emotional companion game with AI-powered relationships

## 🚀 개발 환경 설정

### 필수 조건

- Node.js 18.0.0 이상
- npm 9.0.0 이상
- Claude API 키
- Supabase 프로젝트

### 빠른 시작

1. **프로젝트 설정 스크립트 실행**

   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

2. **프로젝트 디렉토리로 이동**

   ```bash
   cd soulmate
   ```

3. **환경 변수 설정**

   ```bash
   cp .env.example .env.local
   # .env.local 파일을 편집하여 API 키 설정
   ```

4. **개발 서버 시작**
   ```bash
   npm run dev
   ```

## ⚙️ 환경 변수 설정

`.env.local` 파일에 다음 변수들을 설정하세요:

```env
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
```

## 📜 사용 가능한 스크립트

```bash
npm run dev          # 개발 서버 시작
npm run build        # 프로덕션 빌드
npm run preview      # 빌드 미리보기
npm run lint         # ESLint 실행
npm run lint:fix     # ESLint 자동 수정
npm run format       # Prettier 포맷팅
npm run type-check   # TypeScript 타입 검사
npm run clean        # 캐시 정리
```

## 📁 프로젝트 구조

```
src/
├── components/          # React 컴포넌트
│   ├── ui/             # 재사용 가능한 UI 컴포넌트
│   ├── game/           # 게임 특화 컴포넌트
│   └── chat/           # 채팅 관련 컴포넌트
├── store/              # Zustand 상태 관리
├── api/                # API 통신 로직
├── types/              # TypeScript 타입 정의
├── hooks/              # 커스텀 React 훅
├── utils/              # 유틸리티 함수
├── config/             # 설정 파일
└── assets/             # 이미지, 사운드 등
```

Made with ❤️ and 🤖 AI
