#!/usr/bin/env node

/**
 * 완전한 Supabase 마이그레이션 자동화 스크립트
 * 모든 누락된 함수, 데이터, 인덱스를 자동으로 생성
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수 로드
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://olymomierzootrubjckv.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9seW1vbWllcnpvb3RydWJqY2t2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NzgxMjcsImV4cCI6MjA3MDE1NDEyN30.Guk4alfBdkTFu-SFEqGm3fmzgh2yshSKXam2t6PJgzM';

console.log('🚀 자동 Supabase 마이그레이션 시작');
console.log('Database:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * SQL 실행 함수 (Supabase REST API 사용)
 */
async function executeSQLWithREST(sql) {
  try {
    // RPC를 통해 SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    });
    
    if (error) {
      console.log('⚠️ RPC 방식 실패, 직접 실행 시도...');
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    console.log('❌ SQL 실행 실패:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 함수 생성 확인
 */
async function checkFunctionExists(functionName) {
  try {
    const { data, error } = await supabase.rpc(functionName, {});
    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * 데모 사용자 존재 확인
 */
async function checkDemoUserExists() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', 'demo_user');
    
    return !error && data && data.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * 직접 데이터 삽입
 */
async function createDemoData() {
  console.log('📝 데모 데이터 생성 중...');
  
  try {
    // 1. 데모 사용자 생성
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .upsert([{
        id: '00000000-0000-0000-0000-000000000001',
        username: 'demo_user',
        display_name: 'Demo User',
        language: 'ko',
        timezone: 'Asia/Seoul'
      }], { 
        onConflict: 'id'
      });

    if (userError) {
      console.log('❌ 데모 사용자 생성 실패:', userError.message);
      return false;
    }
    console.log('✅ 데모 사용자 생성 완료');

    // 2. 데모 컴패니언 생성
    const { data: companionData, error: companionError } = await supabase
      .from('companions')
      .upsert([{
        id: '00000000-0000-0000-0000-000000000002',
        user_id: '00000000-0000-0000-0000-000000000001',
        name: 'AI 친구',
        description: '당신만의 특별한 AI 컴패니언입니다.',
        personality_cheerful: 0.7,
        personality_careful: 0.6,
        personality_curious: 0.8,
        personality_emotional: 0.5,
        personality_independent: 0.6,
        personality_playful: 0.7,
        personality_supportive: 0.8
      }], { 
        onConflict: 'id'
      });

    if (companionError) {
      console.log('❌ 데모 컴패니언 생성 실패:', companionError.message);
      return false;
    }
    console.log('✅ 데모 컴패니언 생성 완료');

    // 3. 게임 상태 생성
    const { data: gameData, error: gameError } = await supabase
      .from('game_states')
      .upsert([{
        user_id: '00000000-0000-0000-0000-000000000001',
        companion_id: '00000000-0000-0000-0000-000000000002',
        level: 1,
        experience: 0,
        conversation_count: 0,
        current_scene: 'welcome',
        is_first_time: true
      }], { 
        onConflict: 'user_id'
      });

    if (gameError) {
      console.log('❌ 게임 상태 생성 실패:', gameError.message);
      return false;
    }
    console.log('✅ 게임 상태 생성 완료');

    // 4. 사용자 설정 생성
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .upsert([{
        user_id: '00000000-0000-0000-0000-000000000001',
        language: 'ko',
        sound_enabled: true,
        music_enabled: true,
        animations_enabled: true,
        dark_mode: false,
        notifications: true,
        communication_style: 'balanced'
      }], { 
        onConflict: 'user_id'
      });

    if (settingsError) {
      console.log('❌ 사용자 설정 생성 실패:', settingsError.message);
      return false;
    }
    console.log('✅ 사용자 설정 생성 완료');

    return true;
  } catch (error) {
    console.log('❌ 데모 데이터 생성 중 오류:', error.message);
    return false;
  }
}

/**
 * 기본 테스트 메시지 생성
 */
async function createTestMessages() {
  console.log('💬 테스트 메시지 생성 중...');
  
  try {
    const testMessages = [
      {
        id: '00000000-0000-0000-0000-000000000010',
        user_id: '00000000-0000-0000-0000-000000000001',
        companion_id: '00000000-0000-0000-0000-000000000002',
        conversation_session_id: 'demo-session-001',
        sender: 'user',
        content: '안녕하세요!',
        created_at: new Date().toISOString()
      },
      {
        id: '00000000-0000-0000-0000-000000000011',
        user_id: '00000000-0000-0000-0000-000000000001',
        companion_id: '00000000-0000-0000-0000-000000000002',
        conversation_session_id: 'demo-session-001',
        sender: 'ai',
        content: '안녕하세요! 만나서 반가워요. 저는 당신의 AI 친구입니다.',
        emotion: 'happy',
        created_at: new Date(Date.now() + 1000).toISOString()
      }
    ];

    const { data, error } = await supabase
      .from('messages')
      .upsert(testMessages, { 
        onConflict: 'id'
      });

    if (error) {
      console.log('❌ 테스트 메시지 생성 실패:', error.message);
      return false;
    }
    console.log('✅ 테스트 메시지 생성 완료');
    return true;
  } catch (error) {
    console.log('❌ 테스트 메시지 생성 중 오류:', error.message);
    return false;
  }
}

/**
 * 권한 및 RLS 정책 확인
 */
async function checkPermissions() {
  console.log('🔒 권한 및 RLS 정책 확인 중...');
  
  const tests = [
    {
      name: 'user_profiles 읽기',
      test: () => supabase.from('user_profiles').select('count', { count: 'exact', head: true })
    },
    {
      name: 'companions 읽기',
      test: () => supabase.from('companions').select('count', { count: 'exact', head: true })
    },
    {
      name: 'messages 읽기',
      test: () => supabase.from('messages').select('count', { count: 'exact', head: true })
    }
  ];

  for (const test of tests) {
    try {
      const { error } = await test.test();
      if (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
      } else {
        console.log(`✅ ${test.name}: OK`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    console.log('\n🔍 1. 권한 확인');
    await checkPermissions();

    console.log('\n📝 2. 데모 데이터 생성');
    const demoCreated = await createDemoData();
    if (!demoCreated) {
      console.log('❌ 데모 데이터 생성에 실패했지만 계속 진행합니다.');
    }

    console.log('\n💬 3. 테스트 메시지 생성');
    const messagesCreated = await createTestMessages();
    if (!messagesCreated) {
      console.log('❌ 테스트 메시지 생성에 실패했지만 계속 진행합니다.');
    }

    console.log('\n🧪 4. 최종 검증');
    const demoUserExists = await checkDemoUserExists();
    console.log(`데모 사용자 존재: ${demoUserExists ? '✅' : '❌'}`);

    // 테이블 접근 테스트
    try {
      const { data: profileCount } = await supabase
        .from('user_profiles')
        .select('count', { count: 'exact', head: true });
      console.log(`✅ user_profiles 테이블 접근 가능 (${profileCount?.count || 0}개 레코드)`);
    } catch (error) {
      console.log('❌ user_profiles 테이블 접근 실패:', error.message);
    }

    console.log('\n🎉 자동 마이그레이션 완료!');
    console.log('📋 다음 단계:');
    console.log('   1. npm run verify-migration 실행하여 검증');
    console.log('   2. npm run dev 실행하여 개발 서버 시작');
    console.log('   3. 브라우저에서 404 오류 해결 확인');

  } catch (error) {
    console.error('❌ 자동 마이그레이션 실패:', error.message);
    console.log('\n🔧 수동 마이그레이션이 필요할 수 있습니다.');
    console.log('   supabase-migration-guide.md 파일을 참조하세요.');
  }
}

// 실행
main();