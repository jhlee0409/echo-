-- =======================================================
-- 누락된 함수 및 데이터 완전 마이그레이션
-- Supabase SQL Editor에서 직접 실행하세요
-- =======================================================

-- 1. 확장 프로그램 활성화 (재확인)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. 업데이트 트리거 함수 (재생성)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 트리거 재생성 (존재하지 않을 경우)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_companions_updated_at ON companions;
CREATE TRIGGER update_companions_updated_at
    BEFORE UPDATE ON companions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_game_states_updated_at ON game_states;
CREATE TRIGGER update_game_states_updated_at
    BEFORE UPDATE ON game_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. 컴패니언 생성 함수
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

-- 5. 관계도 업데이트 함수
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
    -- 상호작용 타입에 따른 수치 조정
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
    
    -- 컴패니언 관계도 업데이트
    UPDATE companions
    SET 
        relationship_experience = relationship_experience + experience_gain,
        intimacy_level = LEAST(1.0, GREATEST(0.0, intimacy_level + intimacy_gain)),
        trust_level = LEAST(1.0, GREATEST(0.0, trust_level + trust_gain)),
        updated_at = NOW()
    WHERE id = p_companion_id;
    
    -- 레벨업 확인
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

-- 6. 사용자 생성 시 자동 설정 생성 함수
CREATE OR REPLACE FUNCTION create_user_defaults(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    companion_id UUID;
BEGIN
    -- 기본 컴패니언 생성
    companion_id := create_default_companion(p_user_id);
    
    -- 기본 게임 상태 생성
    INSERT INTO game_states (user_id, companion_id)
    VALUES (p_user_id, companion_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- 기본 사용자 설정 생성
    INSERT INTO user_settings (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- 7. 메시지 통계 업데이트 함수
CREATE OR REPLACE FUNCTION update_message_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 대화 카운트 증가
    UPDATE game_states 
    SET conversation_count = conversation_count + 1,
        last_played = NOW(),
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- 컴패니언 관계도 업데이트 (긍정적 상호작용으로 가정)
    IF NEW.sender = 'user' THEN
        PERFORM update_companion_relationship(NEW.companion_id, 'positive');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. 메시지 삽입 트리거
DROP TRIGGER IF EXISTS update_message_stats_trigger ON messages;
CREATE TRIGGER update_message_stats_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_stats();

-- 9. 성능 최적화를 위한 추가 인덱스
CREATE INDEX IF NOT EXISTS idx_companions_relationship_level ON companions(relationship_level);
CREATE INDEX IF NOT EXISTS idx_companions_intimacy_level ON companions(intimacy_level);
CREATE INDEX IF NOT EXISTS idx_game_states_last_played ON game_states(last_played DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at_desc ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender);

-- 10. 데모 데이터 삽입
-- 데모 사용자
INSERT INTO user_profiles (id, username, display_name, language, timezone) 
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'demo_user',
    'Demo User',
    'ko',
    'Asia/Seoul'
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();

-- 데모 사용자를 위한 기본 설정 생성
SELECT create_user_defaults('00000000-0000-0000-0000-000000000001'::UUID);

-- 11. 테스트 메시지 삽입
INSERT INTO messages (id, user_id, companion_id, conversation_session_id, sender, content, emotion, created_at) VALUES 
(
    '00000000-0000-0000-0000-000000000010'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    (SELECT id FROM companions WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID LIMIT 1),
    'demo-session-001',
    'user',
    '안녕하세요!',
    NULL,
    NOW() - INTERVAL '5 minutes'
),
(
    '00000000-0000-0000-0000-000000000011'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    (SELECT id FROM companions WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID LIMIT 1),
    'demo-session-001',
    'ai',
    '안녕하세요! 만나서 반가워요. 저는 당신의 AI 친구입니다.',
    'happy',
    NOW() - INTERVAL '4 minutes'
),
(
    '00000000-0000-0000-0000-000000000012'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    (SELECT id FROM companions WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID LIMIT 1),
    'demo-session-001',
    'user',
    '기능이 잘 동작하는지 테스트해보고 있어요.',
    NULL,
    NOW() - INTERVAL '3 minutes'
),
(
    '00000000-0000-0000-0000-000000000013'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    (SELECT id FROM companions WHERE user_id = '00000000-0000-0000-0000-000000000001'::UUID LIMIT 1),
    'demo-session-001',
    'ai',
    '네! 모든 기능이 정상적으로 동작하고 있어요. 저와 대화하면서 우리의 관계가 발전해나갈 거예요!',
    'excited',
    NOW() - INTERVAL '2 minutes'
)
ON CONFLICT (id) DO UPDATE SET 
    content = EXCLUDED.content,
    emotion = EXCLUDED.emotion;

-- 12. 추가 테스트 사용자 (선택적)
INSERT INTO user_profiles (id, username, display_name, language, timezone) 
VALUES (
    '00000000-0000-0000-0000-000000000003'::UUID,
    'test_user',
    'Test User',
    'en',
    'UTC'
) ON CONFLICT (id) DO NOTHING;

-- 테스트 사용자 기본 설정
SELECT create_user_defaults('00000000-0000-0000-0000-000000000003'::UUID);

-- 13. RLS 정책 재확인 및 보완
-- 공개 프로필 조회 정책 추가 (기존 정책이 있으면 삭제 후 재생성)
DO $$
BEGIN
    -- 기존 정책이 있으면 삭제
    DROP POLICY IF EXISTS "Public profiles are viewable" ON user_profiles;
    
    -- 새 정책 생성
    CREATE POLICY "Public profiles are viewable" ON user_profiles
        FOR SELECT USING (is_public = true);
EXCEPTION
    WHEN OTHERS THEN
        -- 정책이 이미 존재하는 경우 무시
        NULL;
END $$;

-- 14. 데이터베이스 통계 업데이트
ANALYZE user_profiles;
ANALYZE companions;
ANALYZE game_states;
ANALYZE messages;
ANALYZE user_settings;

-- =======================================================
-- 마이그레이션 완료
-- =======================================================

-- 완료 확인 쿼리
SELECT 
    'Migration Complete!' as status,
    (SELECT COUNT(*) FROM user_profiles) as users,
    (SELECT COUNT(*) FROM companions) as companions,
    (SELECT COUNT(*) FROM messages) as messages,
    (SELECT COUNT(*) FROM game_states) as game_states,
    (SELECT COUNT(*) FROM user_settings) as user_settings;

-- 함수 존재 확인
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_default_companion', 'update_companion_relationship', 'create_user_defaults')
ORDER BY routine_name;