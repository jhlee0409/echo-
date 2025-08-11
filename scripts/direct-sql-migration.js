#!/usr/bin/env node

/**
 * 직접 SQL 실행을 통한 Supabase 마이그레이션
 * REST API 대신 SQL 명령어를 직접 실행
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || 'https://olymomierzootrubjckv.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9seW1vbWllcnpvb3RydWJqY2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzgxMjcsImV4cCI6MjA3MDE1NDEyN30.Guk4alfBdkTFu-SFEqGm3fmzgh2yshSKXam2t6PJgzM'

console.log('🚀 직접 SQL 마이그레이션 실행')

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * 원시 SQL 실행 함수
 */
async function executeRawSQL(sql) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ sql_query: sql }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.log(`❌ SQL 실행 실패: ${error.message}`)
    return { success: false, error: error.message }
  }
}

/**
 * 단계별 SQL 명령어 실행
 */
async function executeMigrationSteps() {
  const steps = [
    {
      name: '확장 프로그램 활성화',
      sql: `
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
      `,
    },
    {
      name: '함수 생성: create_default_companion',
      sql: `
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
      `,
    },
    {
      name: '함수 생성: update_companion_relationship',
      sql: `
        CREATE OR REPLACE FUNCTION update_companion_relationship(
            p_companion_id UUID, p_interaction_type TEXT, p_user_emotion TEXT DEFAULT NULL
        ) RETURNS VOID AS $$
        DECLARE
            experience_gain INTEGER := 5;
            intimacy_gain DECIMAL := 0.01;
            trust_gain DECIMAL := 0.01;
        BEGIN
            CASE p_interaction_type
                WHEN 'positive' THEN experience_gain := 10; intimacy_gain := 0.02; trust_gain := 0.02;
                WHEN 'neutral' THEN experience_gain := 5; intimacy_gain := 0.01; trust_gain := 0.01;
                WHEN 'negative' THEN experience_gain := 2; intimacy_gain := -0.01; trust_gain := -0.01;
                ELSE experience_gain := 5;
            END CASE;

            UPDATE companions SET
                relationship_experience = relationship_experience + experience_gain,
                intimacy_level = LEAST(1.0, GREATEST(0.0, intimacy_level + intimacy_gain)),
                trust_level = LEAST(1.0, GREATEST(0.0, trust_level + trust_gain)),
                updated_at = NOW()
            WHERE id = p_companion_id;

            UPDATE companions SET
                relationship_level = relationship_level + 1,
                relationship_experience = relationship_experience - relationship_experience_to_next,
                relationship_experience_to_next = relationship_experience_to_next + 50
            WHERE id = p_companion_id
              AND relationship_experience >= relationship_experience_to_next
              AND relationship_level < 10;
        END;
        $$ LANGUAGE plpgsql;
      `,
    },
  ]

  console.log('📋 단계별 SQL 실행:')

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    console.log(`\n${i + 1}. ${step.name}`)

    const result = await executeRawSQL(step.sql)
    if (result.success) {
      console.log('✅ 성공')
    } else {
      console.log(`❌ 실패: ${result.error}`)
    }
  }
}

/**
 * 직접 데이터 삽입 (INSERT 사용)
 */
async function insertDemoDataDirectly() {
  console.log('\n📝 직접 데이터 삽입 시작')

  const insertSteps = [
    {
      name: '데모 사용자',
      sql: `
        INSERT INTO user_profiles (id, username, display_name, language, timezone)
        VALUES ('00000000-0000-0000-0000-000000000001'::UUID, 'demo_user', 'Demo User', 'ko', 'Asia/Seoul')
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          display_name = EXCLUDED.display_name,
          updated_at = NOW();
      `,
    },
    {
      name: '데모 컴패니언',
      sql: `
        INSERT INTO companions (id, user_id, name, description, personality_cheerful, personality_careful, personality_curious, personality_emotional, personality_independent, personality_playful, personality_supportive)
        VALUES ('00000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'AI 친구', '당신만의 특별한 AI 컴패니언입니다.', 0.7, 0.6, 0.8, 0.5, 0.6, 0.7, 0.8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          updated_at = NOW();
      `,
    },
    {
      name: '게임 상태',
      sql: `
        INSERT INTO game_states (user_id, companion_id, level, experience, current_scene, is_first_time)
        VALUES ('00000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000002'::UUID, 1, 0, 'welcome', true)
        ON CONFLICT (user_id) DO UPDATE SET
          companion_id = EXCLUDED.companion_id,
          updated_at = NOW();
      `,
    },
    {
      name: '사용자 설정',
      sql: `
        INSERT INTO user_settings (user_id, language, communication_style)
        VALUES ('00000000-0000-0000-0000-000000000001'::UUID, 'ko', 'balanced')
        ON CONFLICT (user_id) DO UPDATE SET
          language = EXCLUDED.language,
          updated_at = NOW();
      `,
    },
    {
      name: '테스트 메시지',
      sql: `
        INSERT INTO messages (id, user_id, companion_id, conversation_session_id, sender, content, created_at) VALUES
        ('00000000-0000-0000-0000-000000000010'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000002'::UUID, 'demo-session-001', 'user', '안녕하세요!', NOW()),
        ('00000000-0000-0000-0000-000000000011'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, '00000000-0000-0000-0000-000000000002'::UUID, 'demo-session-001', 'ai', '안녕하세요! 만나서 반가워요. 저는 당신의 AI 친구입니다.', NOW() + interval '1 second')
        ON CONFLICT (id) DO UPDATE SET
          content = EXCLUDED.content;
      `,
    },
  ]

  for (let i = 0; i < insertSteps.length; i++) {
    const step = insertSteps[i]
    console.log(`\n${i + 1}. ${step.name} 삽입`)

    const result = await executeRawSQL(step.sql)
    if (result.success) {
      console.log('✅ 성공')
    } else {
      console.log(`❌ 실패: ${result.error}`)
    }
  }
}

/**
 * 최종 검증
 */
async function finalVerification() {
  console.log('\n🧪 최종 검증')

  const verifications = [
    {
      name: '데모 사용자',
      test: () =>
        supabase
          .from('user_profiles')
          .select('username')
          .eq('username', 'demo_user'),
    },
    {
      name: '컴패니언',
      test: () =>
        supabase
          .from('companions')
          .select('name')
          .eq('user_id', '00000000-0000-0000-0000-000000000001'),
    },
    {
      name: '메시지',
      test: () =>
        supabase
          .from('messages')
          .select('content')
          .eq('conversation_session_id', 'demo-session-001'),
    },
  ]

  for (const verification of verifications) {
    try {
      const { data, error } = await verification.test()
      if (error) {
        console.log(`❌ ${verification.name}: ${error.message}`)
      } else {
        console.log(`✅ ${verification.name}: ${data?.length || 0}개 발견`)
      }
    } catch (error) {
      console.log(`❌ ${verification.name}: ${error.message}`)
    }
  }
}

/**
 * 메인 실행
 */
async function main() {
  try {
    await executeMigrationSteps()
    await insertDemoDataDirectly()
    await finalVerification()

    console.log('\n🎉 직접 SQL 마이그레이션 완료!')
    console.log('\n📋 확인 사항:')
    console.log('✓ 확장 프로그램 활성화')
    console.log('✓ 함수 생성')
    console.log('✓ 데모 데이터 삽입')
    console.log('✓ 테스트 메시지 생성')

    console.log('\n🚀 다음 단계:')
    console.log('   npm run verify-migration')
    console.log('   npm run dev')
  } catch (error) {
    console.error('❌ 직접 SQL 마이그레이션 실패:', error)
  }
}

main()
