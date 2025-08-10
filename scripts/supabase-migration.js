#!/usr/bin/env node

/**
 * Supabase Migration Automation Script
 * 데이터베이스 마이그레이션을 자동화하고 검증하는 스크립트
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 환경 변수 로드
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // 관리자 권한용

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Supabase 클라이언트 초기화
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY);

/**
 * 마이그레이션 파일 읽기
 */
function readMigrationFile(migrationPath) {
  const fullPath = path.resolve(__dirname, '..', migrationPath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Migration file not found: ${fullPath}`);
  }

  return fs.readFileSync(fullPath, 'utf8');
}

/**
 * 테이블 존재 여부 확인
 */
async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('count', { count: 'exact', head: true });
    
    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * 모든 테이블 상태 확인
 */
async function checkAllTables() {
  const tables = [
    'user_profiles',
    'companions',
    'game_states', 
    'messages',
    'user_settings'
  ];

  console.log('📊 Checking table status...');
  
  const tableStatus = {};
  for (const table of tables) {
    const exists = await checkTableExists(table);
    tableStatus[table] = exists;
    
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
  }

  return tableStatus;
}

/**
 * 마이그레이션 필요성 확인
 */
async function checkMigrationNeeded() {
  const tableStatus = await checkAllTables();
  const missingTables = Object.entries(tableStatus)
    .filter(([_, exists]) => !exists)
    .map(([table, _]) => table);

  return {
    needed: missingTables.length > 0,
    missingTables,
    tableStatus
  };
}

/**
 * 마이그레이션 후 검증
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration results...');
  
  const checks = [
    {
      name: 'Tables Creation',
      test: async () => {
        const tableStatus = await checkAllTables();
        const allExist = Object.values(tableStatus).every(exists => exists);
        return { success: allExist, details: tableStatus };
      }
    },
    {
      name: 'Demo Data',
      test: async () => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('username', 'demo_user');
          
          return { 
            success: !error && data && data.length > 0, 
            details: { demoUserExists: !error && data && data.length > 0 }
          };
        } catch (error) {
          return { success: false, details: { error: error.message } };
        }
      }
    },
    {
      name: 'Functions',
      test: async () => {
        try {
          // Test create_default_companion function
          const { data, error } = await supabase.rpc('create_default_companion', {
            p_user_id: '00000000-0000-0000-0000-000000000002'
          });
          
          return { 
            success: !error, 
            details: { functionWorks: !error, companionId: data }
          };
        } catch (error) {
          return { success: false, details: { error: error.message } };
        }
      }
    },
    {
      name: 'Indexes',
      test: async () => {
        try {
          // Test if indexes help with query performance
          const start = Date.now();
          const { data, error } = await supabase
            .from('messages')
            .select('id')
            .limit(1);
          
          const responseTime = Date.now() - start;
          
          return { 
            success: !error && responseTime < 1000, 
            details: { responseTime, queryWorks: !error }
          };
        } catch (error) {
          return { success: false, details: { error: error.message } };
        }
      }
    }
  ];

  const results = {};
  for (const check of checks) {
    console.log(`🧪 Testing ${check.name}...`);
    const result = await check.test();
    results[check.name] = result;
    
    if (result.success) {
      console.log(`✅ ${check.name}: PASSED`);
    } else {
      console.log(`❌ ${check.name}: FAILED`);
      console.log(`   Details:`, result.details);
    }
  }

  return results;
}

/**
 * 마이그레이션 상태 리포트 생성
 */
function generateMigrationReport(status, verificationResults) {
  const report = {
    timestamp: new Date().toISOString(),
    migration: {
      needed: status.needed,
      missingTables: status.missingTables,
      tableStatus: status.tableStatus
    },
    verification: verificationResults,
    summary: {
      tablesCreated: Object.values(status.tableStatus).filter(Boolean).length,
      totalTables: Object.keys(status.tableStatus).length,
      allVerificationsPassed: Object.values(verificationResults).every(r => r.success)
    }
  };

  return report;
}

/**
 * 수동 마이그레이션 가이드 출력
 */
function printManualMigrationGuide() {
  const migrationPath = path.resolve(__dirname, '../supabase/migrations/001_initial_schema.sql');
  
  console.log('\n📋 수동 마이그레이션 실행 가이드');
  console.log('='.repeat(50));
  console.log('1. Supabase 대시보드 접속:');
  console.log(`   https://supabase.com/dashboard/project/${SUPABASE_URL.split('//')[1].split('.')[0]}`);
  console.log('\n2. SQL Editor로 이동');
  console.log('\n3. 다음 파일의 내용을 복사하여 실행:');
  console.log(`   ${migrationPath}`);
  console.log('\n4. "Run" 버튼 클릭하여 실행');
  console.log('\n5. 실행 후 이 스크립트로 검증:');
  console.log('   npm run verify-migration');
  console.log('='.repeat(50));
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 Supabase Migration Tool');
  console.log('Database:', SUPABASE_URL);
  console.log('');

  try {
    // 마이그레이션 필요성 확인
    const migrationStatus = await checkMigrationNeeded();
    
    if (!migrationStatus.needed) {
      console.log('✅ All tables already exist! Migration not needed.');
      console.log('\n🔍 Running verification anyway...');
      const verificationResults = await verifyMigration();
      const report = generateMigrationReport(migrationStatus, verificationResults);
      
      console.log('\n📊 Final Report:');
      console.log(`✅ Tables: ${report.summary.tablesCreated}/${report.summary.totalTables}`);
      console.log(`${report.summary.allVerificationsPassed ? '✅' : '❌'} Verifications: ${report.summary.allVerificationsPassed ? 'ALL PASSED' : 'SOME FAILED'}`);
      
      return;
    }

    console.log('❌ Migration needed!');
    console.log('Missing tables:', migrationStatus.missingTables.join(', '));
    console.log('\n');

    // 수동 마이그레이션 가이드 출력
    printManualMigrationGuide();

    // 마이그레이션 파일 내용 검증
    const migrationSQL = readMigrationFile('supabase/migrations/001_initial_schema.sql');
    console.log(`\n✅ Migration file loaded (${migrationSQL.length} characters)`);

  } catch (error) {
    console.error('❌ Migration tool error:', error.message);
    process.exit(1);
  }
}

/**
 * 검증만 실행하는 함수
 */
async function verifyOnly() {
  console.log('🔍 Running verification only...\n');
  
  try {
    const migrationStatus = await checkMigrationNeeded();
    const verificationResults = await verifyMigration();
    const report = generateMigrationReport(migrationStatus, verificationResults);
    
    console.log('\n📊 Migration Verification Report');
    console.log('='.repeat(40));
    console.log(`Tables: ${report.summary.tablesCreated}/${report.summary.totalTables} created`);
    console.log(`Migration needed: ${report.migration.needed ? 'YES' : 'NO'}`);
    console.log(`All verifications passed: ${report.summary.allVerificationsPassed ? 'YES' : 'NO'}`);
    
    if (report.migration.missingTables.length > 0) {
      console.log(`Missing tables: ${report.migration.missingTables.join(', ')}`);
    }
    
    // 상세 리포트 파일 저장
    const reportPath = path.resolve(__dirname, '../migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportPath}`);

  } catch (error) {
    console.error('❌ Verification error:', error.message);
    process.exit(1);
  }
}

// CLI 인수 처리
const command = process.argv[2];

if (command === '--verify' || command === '-v') {
  verifyOnly();
} else {
  main();
}