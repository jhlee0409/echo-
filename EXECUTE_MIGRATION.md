# 🚀 Supabase 마이그레이션 즉시 실행 가이드

## ✅ 지금 바로 실행하세요!

### 1단계: Supabase 대시보드 접속
**링크를 클릭하세요**: https://supabase.com/dashboard/project/olymomierzootrubjckv

### 2단계: SQL Editor 이동
- 왼쪽 사이드바에서 **"SQL Editor"** 클릭

### 3단계: 새 쿼리 생성
- **"New query"** 버튼 클릭

### 4단계: SQL 복사 & 실행
아래 파일의 **전체 내용**을 복사하여 붙여넣기:
```
supabase/migrations/002_missing_functions_and_data.sql
```

**또는** 아래 SQL을 직접 복사:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create default companion function
CREATE OR REPLACE FUNCTION create_default_companion(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    companion_id UUID;
BEGIN
    INSERT INTO companions (
        user_id, name, description,
        personality_cheerful, personality_careful, personality_curious,
        personality_emotional, personality_independent, personality_playful, personality_supportive
    ) VALUES (
        p_user_id, 'AI 친구', '당신만의 특별한 AI 컴패니언입니다.',
        0.7, 0.6, 0.8, 0.5, 0.6, 0.7, 0.8
    ) RETURNING id INTO companion_id;
    
    RETURN companion_id;
END;
$$ LANGUAGE plpgsql;

-- Create user defaults function
CREATE OR REPLACE FUNCTION create_user_defaults(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    companion_id UUID;
BEGIN
    companion_id := create_default_companion(p_user_id);
    
    INSERT INTO game_states (user_id, companion_id)
    VALUES (p_user_id, companion_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    INSERT INTO user_settings (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Insert demo user
INSERT INTO user_profiles (id, username, display_name, language, timezone) 
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'demo_user', 'Demo User', 'ko', 'Asia/Seoul'
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();

-- Create demo user defaults
SELECT create_user_defaults('00000000-0000-0000-0000-000000000001'::UUID);

-- Insert test messages
INSERT INTO messages (id, user_id, companion_id, conversation_session_id, sender, content, emotion, created_at) VALUES 
(
    '00000000-0000-0000-0000-000000000010'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    (SELECT id FROM companions WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID LIMIT 1),
    'demo-session-001', 'user', '안녕하세요!', NULL, NOW() - INTERVAL '5 minutes'
),
(
    '00000000-0000-0000-0000-000000000011'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    (SELECT id FROM companions WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID LIMIT 1),
    'demo-session-001', 'ai', '안녕하세요! 만나서 반가워요. 저는 당신의 AI 친구입니다.', 'happy', NOW() - INTERVAL '4 minutes'
)
ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;

-- Verification query
SELECT 
    'Migration Complete!' as status,
    (SELECT COUNT(*) FROM user_profiles) as users,
    (SELECT COUNT(*) FROM companions) as companions,
    (SELECT COUNT(*) FROM messages) as messages;
```

### 5단계: 실행
- **"Run"** 버튼 클릭
- 결과에서 `Migration Complete!`와 함께 카운트 확인

### 6단계: 검증
터미널에서 실행:
```bash
npm run verify-migration
```

**예상 결과**:
```
✅ Tables: 5/5
✅ Demo Data: PASSED  
✅ Functions: PASSED
✅ Verifications: ALL PASSED
```

### 7단계: 개발 서버 시작
```bash
npm run dev
```

## 🎯 완료 후 확인사항

1. **브라우저 콘솔**에서 404 에러 사라짐 확인
2. **Supabase 연결 성공** 메시지 확인  
3. **AI 대화 기능** 정상 동작 확인

## ❌ 문제 발생시

1. SQL 실행 오류 → 각 함수를 개별적으로 실행
2. 권한 오류 → Database > Settings > API 에서 서비스 키 확인
3. 여전히 404 → 브라우저 캐시 클리어 후 재시도

---
**🚨 지금 바로 실행하세요!** 3분이면 모든 오류가 해결됩니다.