#!/usr/bin/env node

/**
 * 소울메이트 개발 진행상황 모니터링 스크립트
 * 실시간으로 개발 진행 상황을 추적하고 표시합니다
 */

import chalk from 'chalk'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

// ANSI 이스케이프 코드로 화면 지우기
const clearScreen = () => {
  process.stdout.write('\x1Bc')
}

async function checkFileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function countFiles(dir, extension) {
  try {
    const { stdout } = await execAsync(`find ${dir} -name "*.${extension}" -type f | wc -l`)
    return parseInt(stdout.trim())
  } catch {
    return 0
  }
}

async function getTestStats() {
  try {
    const { stdout } = await execAsync('npm test -- --run --reporter=json', { 
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10 
    })
    
    // JSON 출력에서 테스트 통계 추출
    const lines = stdout.split('\n')
    const jsonLine = lines.find(line => line.includes('"numTotalTests"'))
    
    if (jsonLine) {
      const stats = JSON.parse(jsonLine)
      return {
        total: stats.numTotalTests || 0,
        passed: stats.numPassedTests || 0,
        failed: stats.numFailedTests || 0
      }
    }
  } catch (error) {
    // 테스트 실패 시 간단한 통계 추출
    try {
      const { stdout } = await execAsync('npm test -- --run | grep -E "(passed|failed)" | tail -1')
      const passedMatch = stdout.match(/(\d+) passed/)
      const failedMatch = stdout.match(/(\d+) failed/)
      
      return {
        total: (parseInt(passedMatch?.[1] || 0) + parseInt(failedMatch?.[1] || 0)),
        passed: parseInt(passedMatch?.[1] || 0),
        failed: parseInt(failedMatch?.[1] || 0)
      }
    } catch {
      return { total: 0, passed: 0, failed: 0 }
    }
  }
}

async function monitorProgress() {
  if (!process.argv.includes('--no-clear')) {
    clearScreen()
  }
  
  console.log(chalk.blue.bold('📊 소울메이트 개발 진행상황 모니터링\n'))
  console.log(chalk.gray(`마지막 업데이트: ${new Date().toLocaleTimeString('ko-KR')}\n`))
  
  // Phase별 진행 상황 체크
  const phases = {
    'Phase 1 - 프로토타입': {
      completed: true,
      progress: 100,
      items: [
        { name: 'AI 대화 시스템', done: true },
        { name: '인증 시스템', done: true },
        { name: '기본 컴포넌트', done: true },
        { name: '테스트 인프라', done: true }
      ]
    },
    'Phase 2 - 게임플레이': {
      completed: false,
      progress: 0,
      items: [
        { name: '캐릭터 시스템', done: await checkFileExists('./src/store/relationshipStore.ts') },
        { name: '인벤토리 시스템', done: await checkFileExists('./src/components/character/InventorySystem.tsx') },
        { name: '스킬 시스템', done: await checkFileExists('./src/components/character/SkillTree.tsx') },
        { name: '전투 시스템', done: await checkFileExists('./src/systems/AutoBattleSystem.ts') }
      ]
    },
    'Phase 3 - 콘텐츠': {
      completed: false,
      progress: 0,
      items: [
        { name: '대화 콘텐츠', done: await checkFileExists('./src/data/conversations.json') },
        { name: '이벤트 스토리', done: await checkFileExists('./src/data/events.json') },
        { name: '퀘스트 시스템', done: await checkFileExists('./src/data/quests.json') },
        { name: '아트 에셋', done: false }
      ]
    },
    'Phase 4 - 배포': {
      completed: false,
      progress: 0,
      items: [
        { name: '빌드 최적화', done: await checkFileExists('./dist/index.html') },
        { name: '환경 변수 설정', done: await checkFileExists('./.env.production') },
        { name: 'Vercel 설정', done: await checkFileExists('./vercel.json') },
        { name: '배포 완료', done: false }
      ]
    }
  }
  
  // Phase별 진행률 계산 및 표시
  for (const [phaseName, phase] of Object.entries(phases)) {
    const completedItems = phase.items.filter(item => item.done).length
    phase.progress = Math.round((completedItems / phase.items.length) * 100)
    phase.completed = phase.progress === 100
    
    const icon = phase.completed ? '✅' : '🔄'
    console.log(chalk.yellow(`${icon} ${phaseName} (${phase.progress}%)`))
    
    for (const item of phase.items) {
      const itemIcon = item.done ? chalk.green('✓') : chalk.gray('○')
      console.log(`  ${itemIcon} ${item.name}`)
    }
    console.log()
  }
  
  // 전체 진행률 계산
  const totalProgress = Math.round(
    Object.values(phases).reduce((sum, phase) => sum + phase.progress, 0) / Object.keys(phases).length
  )
  
  // 코드 통계
  console.log(chalk.yellow('📈 코드 통계:'))
  const tsFiles = await countFiles('./src', 'ts')
  const tsxFiles = await countFiles('./src', 'tsx')
  const testFiles = await countFiles('./src', 'test.ts')
  
  console.log(`  TypeScript 파일: ${tsFiles + tsxFiles}개`)
  console.log(`  테스트 파일: ${testFiles}개`)
  
  // Git 상태
  try {
    const { stdout: gitStatus } = await execAsync('git status --porcelain | wc -l')
    const changedFiles = parseInt(gitStatus.trim())
    console.log(`  변경된 파일: ${changedFiles}개`)
  } catch {
    console.log(`  Git 상태: 확인 불가`)
  }
  
  // 테스트 상태
  console.log(chalk.yellow('\n🧪 테스트 상태:'))
  const testStats = await getTestStats()
  if (testStats.total > 0) {
    const successRate = Math.round((testStats.passed / testStats.total) * 100)
    console.log(`  총 테스트: ${testStats.total}개`)
    console.log(`  ${chalk.green(`통과: ${testStats.passed}개`)} | ${chalk.red(`실패: ${testStats.failed}개`)}`)
    console.log(`  성공률: ${successRate}%`)
  } else {
    console.log('  테스트 실행 대기 중...')
  }
  
  // TODO 카운트
  try {
    const { stdout: todoCount } = await execAsync('grep -r "TODO" src --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l')
    console.log(`  TODO 항목: ${todoCount.trim()}개`)
  } catch {
    console.log('  TODO 항목: 0개')
  }
  
  // 진행률 시각화
  console.log(chalk.blue(`\n🎯 전체 진행률: ${totalProgress}%`))
  const filled = Math.floor(totalProgress / 5)
  const empty = 20 - filled
  const progressBar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty))
  console.log(`[${progressBar}]`)
  
  // 다음 추천 작업
  console.log(chalk.cyan('\n📌 다음 추천 작업:'))
  
  if (!phases['Phase 2 - 게임플레이'].items[0].done) {
    console.log('  1. npm run phase2:character - 캐릭터 시스템 구현')
  } else if (!phases['Phase 2 - 게임플레이'].items[3].done) {
    console.log('  1. npm run phase2:battle - 전투 시스템 구현')
  } else if (!phases['Phase 3 - 콘텐츠'].items[0].done) {
    console.log('  1. npm run phase3:content - 콘텐츠 자동 생성')
  } else if (!phases['Phase 4 - 배포'].completed) {
    console.log('  1. npm run phase4:deploy - 배포 준비')
  } else {
    console.log('  🎉 모든 Phase 완료! 축하합니다!')
  }
  
  // 실시간 모니터링 모드
  if (process.argv.includes('--watch')) {
    console.log(chalk.gray('\n(5초마다 자동 업데이트 - Ctrl+C로 종료)'))
  }
}

// 실행
async function main() {
  try {
    if (process.argv.includes('--watch')) {
      // 실시간 모니터링
      await monitorProgress()
      setInterval(async () => {
        await monitorProgress()
      }, 5000)
    } else {
      // 1회성 실행
      await monitorProgress()
    }
  } catch (error) {
    console.error(chalk.red('❌ 모니터링 중 오류 발생:'), error.message)
    process.exit(1)
  }
}

main()