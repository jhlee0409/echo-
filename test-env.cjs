#!/usr/bin/env node

// 환경 변수 테스트 스크립트
const fs = require('fs')
const path = require('path')

console.log('🧪 Testing Environment Variables...\n')

// .env.local 파일 읽기
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'))
  
  console.log('📄 Found .env.local with variables:')
  lines.forEach(line => {
    const [key] = line.split('=')
    if (key && key.trim()) {
      console.log(`  ✅ ${key.trim()}`)
    }
  })
  
  console.log('\n🔍 Checking critical variables:')
  
  // 중요한 변수들 체크
  const criticalVars = [
    'VITE_CLAUDE_API_KEY',
    'VITE_SUPABASE_URL', 
    'VITE_SUPABASE_ANON_KEY'
  ]
  
  let allPresent = true
  criticalVars.forEach(varName => {
    const found = lines.some(line => line.startsWith(varName + '='))
    console.log(`  ${found ? '✅' : '❌'} ${varName}`)
    if (!found) allPresent = false
  })
  
  console.log(`\n${allPresent ? '🎉 All critical environment variables are present!' : '⚠️  Some critical variables are missing!'}`)
  
  // API 키 형식 체크
  console.log('\n🔐 API Key format validation:')
  const claudeKeyLine = lines.find(line => line.startsWith('VITE_CLAUDE_API_KEY='))
  if (claudeKeyLine) {
    const apiKey = claudeKeyLine.split('=')[1]
    const isValidFormat = apiKey && apiKey.startsWith('sk-ant-')
    console.log(`  ${isValidFormat ? '✅' : '❌'} Claude API key format: ${isValidFormat ? 'Valid' : 'Invalid (should start with sk-ant-)'}`)
  }
  
  const supabaseUrlLine = lines.find(line => line.startsWith('VITE_SUPABASE_URL='))
  if (supabaseUrlLine) {
    const url = supabaseUrlLine.split('=')[1]
    const isValidUrl = url && url.startsWith('https://') && url.includes('supabase.co')
    console.log(`  ${isValidUrl ? '✅' : '❌'} Supabase URL format: ${isValidUrl ? 'Valid' : 'Invalid (should be https://...supabase.co)'}`)
  }
  
} else {
  console.log('❌ .env.local file not found!')
  process.exit(1)
}

console.log('\n🚀 Environment setup appears ready for service integration!')