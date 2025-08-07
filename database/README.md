# 데이터베이스 스키마 / Database Schema

소울메이트 AI 컴패니언 게임을 위한 Supabase PostgreSQL 데이터베이스 스키마입니다.

## 📋 스키마 개요 / Schema Overview

### 핵심 테이블 / Core Tables

1. **user_profiles** - 사용자 프로필 정보
2. **companions** - AI 컴패니언 데이터 (성격, 관계도, 감정)
3. **game_states** - 게임 진행 상황 및 레벨
4. **messages** - 대화 메시지 저장
5. **user_settings** - 사용자 설정 및 환경설정

### 주요 특징 / Key Features

- **Row Level Security (RLS)**: 사용자별 데이터 보안
- **자동 트리거**: updated_at 필드 자동 업데이트
- **관계 무결성**: Foreign Key 제약조건
- **성능 최적화**: 적절한 인덱스 설정
- **확장성**: UUID 기반 설계

## 🚀 설치 방법 / Installation

### 1. Supabase 프로젝트 설정

1. [Supabase Dashboard](https://app.supabase.com)에서 새 프로젝트 생성
2. 프로젝트 URL과 anon key를 `.env.local`에 추가:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. 마이그레이션 실행

Supabase SQL Editor에서 다음 순서로 실행:

```sql
-- 1. 기본 스키마
\i database/migrations/001_initial_schema.sql

-- 2. 인덱스 및 보안 정책
\i database/migrations/002_indexes_and_rls.sql

-- 3. 함수 및 트리거
\i database/migrations/003_functions_and_triggers.sql

-- 4. (선택사항) 개발용 시드 데이터
\i database/seed.sql
```

또는 전체 스키마 한번에 실행:
```sql
\i database/schema.sql
```

### 3. CLI를 통한 마이그레이션 (고급)

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 실행
supabase db push
```

## 📊 테이블 구조 / Table Structure

### companions 테이블

AI 컴패니언의 핵심 데이터를 저장합니다.

```sql
CREATE TABLE companions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name VARCHAR(50) NOT NULL,
  
  -- 성격 특성 (0.0 - 1.0)
  personality_cheerful REAL DEFAULT 0.5,
  personality_curious REAL DEFAULT 0.5,
  -- ... 기타 성격 특성
  
  -- 관계도
  relationship_level INTEGER DEFAULT 1,
  relationship_experience INTEGER DEFAULT 0,
  intimacy_level REAL DEFAULT 0.1,
  
  -- 현재 감정
  current_emotion VARCHAR(20) DEFAULT 'neutral',
  emotion_intensity REAL DEFAULT 0.5,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### game_states 테이블

사용자의 게임 진행 상황을 저장합니다.

```sql
CREATE TABLE game_states (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  level INTEGER DEFAULT 1,
  experience INTEGER DEFAULT 0,
  conversation_count INTEGER DEFAULT 0,
  play_time INTEGER DEFAULT 0, -- 초 단위
  current_scene VARCHAR(50) DEFAULT 'main_room'
);
```

## 🔧 주요 함수 / Key Functions

### create_default_companion(user_id UUID)

새 사용자를 위한 기본 컴패니언을 생성합니다.

```sql
SELECT public.create_default_companion(auth.uid());
```

### update_companion_relationship(companion_id, interaction_type, user_emotion)

상호작용에 따라 관계도를 업데이트합니다.

```sql
SELECT public.update_companion_relationship(
  'companion-id',
  'positive_chat',
  'happy'
);
```

## 🔐 보안 정책 / Security Policies

모든 테이블에 Row Level Security (RLS)가 적용되어 있습니다:

- 사용자는 자신의 데이터만 접근 가능
- `auth.uid()`를 통한 인증 확인
- Supabase Auth와 완전 통합

## 📈 성능 최적화 / Performance Optimization

### 인덱스

```sql
-- 자주 사용되는 쿼리를 위한 인덱스
CREATE INDEX idx_companions_user_id ON companions(user_id);
CREATE INDEX idx_messages_user_companion ON messages(user_id, companion_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

### 쿼리 최적화

- 복합 인덱스를 통한 JOIN 최적화
- 페이지네이션을 위한 LIMIT/OFFSET
- 실시간 구독을 위한 Supabase Realtime

## 🔄 개발 워크플로 / Development Workflow

### 로컬 개발

1. 테스트 사용자 생성:
```sql
SELECT create_test_user_with_companion('test@example.com', 'cheerful');
```

2. 테스트 데이터 정리:
```sql
SELECT cleanup_test_data();
```

### 프로덕션 배포

1. 스키마 변경사항 검토
2. 백업 생성
3. 마이그레이션 실행
4. 데이터 무결성 검증

## 🐛 문제 해결 / Troubleshooting

### 일반적인 문제들

**RLS 정책 오류**
```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'companions';
```

**트리거 작동 확인**
```sql
-- 트리거 목록 확인
SELECT * FROM pg_trigger WHERE tgname LIKE '%update%';
```

**성능 문제**
```sql
-- 쿼리 실행 계획 확인
EXPLAIN ANALYZE SELECT * FROM companions WHERE user_id = 'user-id';
```

## 📚 참고 자료 / References

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

## 🆕 업데이트 로그 / Update Log

**v1.0.0 - 2025-01-28**
- 초기 스키마 설계
- 기본 테이블 및 관계 설정
- RLS 정책 구현
- 기본 함수 및 트리거 추가