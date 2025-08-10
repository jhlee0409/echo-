# 🚀 Supabase 데이터베이스 마이그레이션 완전 가이드

## 📊 현재 상태
✅ **테이블**: 모든 테이블 생성 완료 (5/5)
❌ **함수**: 누락된 함수들이 있음
❌ **데모 데이터**: 기본 데이터 누락
❌ **인덱스**: 일부 인덱스 문제

## 🔧 완전 마이그레이션 실행 방법

### 1단계: Supabase 대시보드 접속
```
https://supabase.com/dashboard/project/olymomierzootrubjckv
```

### 2단계: SQL Editor로 이동
- 왼쪽 사이드바에서 **"SQL Editor"** 클릭

### 3단계: 새 쿼리 생성
- **"New query"** 버튼 클릭

### 4단계: 마이그레이션 SQL 실행
아래 SQL을 복사하여 붙여넣고 **"Run"** 버튼 클릭:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create function to create default companion for new users
CREATE OR REPLACE FUNCTION create_default_companion(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    companion_id UUID;
BEGIN
    INSERT INTO companions (
        user_id,
        name,
        description,
        personality_cheerful,
        personality_careful,
        personality_curious,
        personality_emotional,
        personality_independent,
        personality_playful,
        personality_supportive
    ) VALUES (
        p_user_id,
        'AI 친구',
        '당신만의 특별한 AI 컴패니언입니다.',
        0.7,  -- cheerful
        0.6,  -- careful
        0.8,  -- curious
        0.5,  -- emotional
        0.6,  -- independent
        0.7,  -- playful
        0.8   -- supportive
    ) RETURNING id INTO companion_id;
    
    RETURN companion_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update companion relationship
CREATE OR REPLACE FUNCTION update_companion_relationship(
    p_companion_id UUID,
    p_interaction_type TEXT,
    p_user_emotion TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    experience_gain INTEGER := 5;
    intimacy_gain DECIMAL := 0.01;
    trust_gain DECIMAL := 0.01;
BEGIN
    -- Adjust gains based on interaction type
    CASE p_interaction_type
        WHEN 'positive' THEN
            experience_gain := 10;
            intimacy_gain := 0.02;
            trust_gain := 0.02;
        WHEN 'neutral' THEN
            experience_gain := 5;
            intimacy_gain := 0.01;
            trust_gain := 0.01;
        WHEN 'negative' THEN
            experience_gain := 2;
            intimacy_gain := -0.01;
            trust_gain := -0.01;
        ELSE
            experience_gain := 5;
    END CASE;
    
    -- Update companion relationship
    UPDATE companions
    SET 
        relationship_experience = relationship_experience + experience_gain,
        intimacy_level = LEAST(1.0, GREATEST(0.0, intimacy_level + intimacy_gain)),
        trust_level = LEAST(1.0, GREATEST(0.0, trust_level + trust_gain)),
        updated_at = NOW()
    WHERE id = p_companion_id;
    
    -- Check for level up
    UPDATE companions
    SET 
        relationship_level = relationship_level + 1,
        relationship_experience = relationship_experience - relationship_experience_to_next,
        relationship_experience_to_next = relationship_experience_to_next + 50
    WHERE id = p_companion_id 
      AND relationship_experience >= relationship_experience_to_next
      AND relationship_level < 10;
END;
$$ LANGUAGE plpgsql;

-- Insert default data for development/testing
INSERT INTO user_profiles (id, username, display_name, language, timezone) 
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'demo_user',
    'Demo User',
    'ko',
    'Asia/Seoul'
) ON CONFLICT (id) DO NOTHING;

-- Create default companion for demo user
DO $$
DECLARE
    demo_companion_id UUID;
BEGIN
    SELECT create_default_companion('00000000-0000-0000-0000-000000000001'::UUID) INTO demo_companion_id;
    
    -- Create default game state
    INSERT INTO game_states (user_id, companion_id)
    VALUES ('00000000-0000-0000-0000-000000000001'::UUID, demo_companion_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create default settings
    INSERT INTO user_settings (user_id)
    VALUES ('00000000-0000-0000-0000-000000000001'::UUID)
    ON CONFLICT (user_id) DO NOTHING;
END $$;
```

## 🔍 5단계: 마이그레이션 검증

마이그레이션 완료 후, 터미널에서 실행:

```bash
npm run verify-migration
```

### 예상 결과:
```
✅ Tables: 5/5
✅ Demo Data: PASSED
✅ Functions: PASSED
✅ Indexes: PASSED
✅ Verifications: ALL PASSED
```

## 🚨 문제 해결

### 함수 생성 오류 발생 시
1. **SQL Editor**에서 각 함수를 개별적으로 실행
2. 오류 메시지 확인 후 문법 수정

### 권한 오류 발생 시
- **Database** → **Settings** → **API** 에서 서비스 키 확인
- RLS 정책이 올바르게 설정되었는지 확인

### 데이터 삽입 오류 발생 시
- 기존 데이터와 충돌하는지 확인
- `ON CONFLICT` 절이 올바른지 확인

## 📈 마이그레이션 후 테스트

### 1. API 연결 테스트
```bash
npm run dev
```

### 2. 브라우저에서 확인
- Console에서 Supabase 연결 성공 메시지 확인
- 404 오류가 해결되었는지 확인

### 3. 기능 테스트
- 사용자 프로필 생성/수정
- 컴패니언 상호작용
- 메시지 저장/불러오기

## ✅ 완료 체크리스트

- [ ] Supabase 대시보드 접속
- [ ] SQL Editor에서 마이그레이션 SQL 실행
- [ ] `npm run verify-migration` 실행하여 모든 검증 통과
- [ ] 개발 서버 재시작
- [ ] 브라우저에서 404 오류 해결 확인
- [ ] 기본 기능 동작 확인

## 📞 지원

문제 발생 시:
1. 마이그레이션 검증 결과 확인
2. Supabase 콘솔의 오류 로그 확인
3. 브라우저 개발자 도구 Network 탭 확인