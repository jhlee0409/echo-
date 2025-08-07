# 🚨 소울메이트 프로젝트 위험 완화 가이드

execution-plan.md 섹션 10에서 정의한 위험 완화 전략의 실행 가이드입니다.

## 🚀 즉시 실행 가능한 위험 완화 조치

### 1. 기술 부채 해결 (CRITICAL - 우선순위 1)

```bash
# Phase 0 시작 전 백업 생성
git checkout -b phase0-debt-resolution
git add . && git commit -m "백업: Phase 0 기술부채 해결 시작 전 상태"

# 일일 진행률 모니터링 설정
./scripts/risk-monitor.sh

# TypeScript 오류 해결 (Day 1)
npm run type-check | grep AIManager  # 30개 목표
# [수동 작업: AIManager 관련 타입 오류 해결]

# 검증
npm run type-check | grep AIManager | wc -l  # 0이어야 함
```

### 2. 위험 모니터링 자동화 설정

```bash
# 매시간 위험 체크 (cron 설정)
# crontab -e 에 추가:
# 0 * * * * cd /Users/jack/client/echo- && ./scripts/risk-monitor.sh >> /tmp/risk-monitor.log 2>&1

# 수동 실행
./scripts/risk-monitor.sh

# 위험 점수 확인
cat /tmp/risk_report_*.json | jq '.riskScore'
```

### 3. 외부 의존성 백업 활성화

```typescript
// src/config/failover.ts 생성
export const failoverConfig = {
  ai: {
    providers: ['claude', 'mock'],
    circuitBreakerThreshold: 3,
    fallbackDelay: 30000,
  },

  database: {
    primary: 'supabase',
    fallback: 'localStorage',
    syncInterval: 300000, // 5분
  },
}
```

## 📊 위험 수준별 대응 매뉴얼

### 🔴 HIGH RISK (위험 점수 70+)

**즉시 실행**:

1. 모든 작업 중단
2. 현재 상태 백업: `git add . && git commit -m "Emergency backup"`
3. 위험 요소 분석: `./scripts/risk-monitor.sh`
4. 롤백 고려: `git checkout [last-stable-commit]`

**대응 체크리스트**:

- [ ] TypeScript 오류 50개 미만으로 감소
- [ ] 테스트 통과율 80% 이상 복구
- [ ] API 응답시간 3초 미만 복구
- [ ] 자동화 스크립트 정상 작동 확인

### 🟡 MEDIUM RISK (위험 점수 40-69)

**모니터링 강화**:

1. 체크 주기 30분으로 단축
2. 자동 알림 활성화
3. 예방적 조치 준비

**예방 조치**:

```bash
# 캐시 정리
npm run clean-cache

# 의존성 재설치
npm ci

# 빌드 테스트
npm run build
```

### 🟢 LOW RISK (위험 점수 0-39)

**정상 모니터링**:

- 1시간마다 체크
- 리포트 생성
- 예방적 유지보수

## 🎯 Phase별 위험 완화 체크포인트

### Phase 0: 기술 부채 해결

**Day 1 체크포인트**:

```bash
# 목표: AIManager 타입 오류 30개 해결
current_errors=$(npm run type-check 2>&1 | grep "AIManager" | wc -l)
if [ $current_errors -le 0 ]; then
  echo "✅ Day 1 목표 달성"
else
  echo "🚨 Day 1 목표 미달성: $current_errors 개 남음"
fi
```

**Week 1 완료 검증**:

```bash
# 완료 조건 확인
typescript_errors=$(npm run type-check 2>&1 | grep -c "error" || echo "0")
test_pass_rate=$(npm test 2>&1 | grep -o "[0-9]\+%" | head -1 | cut -d'%' -f1)

if [ $typescript_errors -lt 10 ] && [ $test_pass_rate -gt 85 ]; then
  echo "✅ Phase 0 완료 - Phase 2 진행 가능"
else
  echo "🚨 Phase 0 미완료 - 추가 작업 필요"
fi
```

### Phase 2-4: 지속적 모니터링

**각 Phase 시작 전**:

```bash
# 사전 검증 스크립트
phase_precheck() {
  local phase=$1

  echo "Phase $phase 사전 검증 중..."

  # 기술 부채 확인
  if [ $(npm run type-check 2>&1 | grep -c "error") -gt 10 ]; then
    echo "🚨 TypeScript 오류 10개 초과 - Phase $phase 연기"
    return 1
  fi

  # 자동화 스크립트 확인
  if ! npm run "phase${phase}:character" --dry-run >/dev/null 2>&1; then
    echo "🚨 자동화 스크립트 실패 - 수동 모드로 전환"
  fi

  echo "✅ Phase $phase 진행 가능"
  return 0
}

# 사용법: phase_precheck 2
```

## 🛠️ 응급 복구 시나리오

### 시나리오 1: 빌드 실패

```bash
# 1. 즉시 이전 커밋으로 롤백
git log --oneline -5
git checkout [last-working-commit]

# 2. 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 3. 빌드 테스트
npm run build
```

### 시나리오 2: API 응답 없음

```bash
# 1. Circuit Breaker 상태 확인
curl -s http://localhost:3000/api/health

# 2. Mock 모드로 전환
export NODE_ENV=development
export AI_PROVIDER=mock

# 3. 서비스 재시작
npm run dev
```

### 시나리오 3: 데이터 손실

```bash
# 1. 백업에서 복구
cp -r backups/latest/* src/

# 2. 데이터베이스 복구
npm run db:restore

# 3. 무결성 검증
npm run test:data-integrity
```

## 📱 알림 및 보고

### Slack/Discord 통합 (선택사항)

```bash
# 위험 알림 전송
send_risk_alert() {
  local risk_score=$1
  local webhook_url="YOUR_WEBHOOK_URL"

  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 위험 점수: $risk_score - 즉시 확인 필요!\"}" \
    $webhook_url
}
```

### 일일 리포트

```bash
# 일일 위험 요약 생성
generate_daily_report() {
  local date=$(date +%Y-%m-%d)

  cat > "reports/daily_risk_$date.md" << EOF
# 일일 위험 리포트 - $date

## 현재 상태
- TypeScript 오류: $(npm run type-check 2>&1 | grep -c "error")개
- 테스트 실패: $(npm test 2>&1 | grep -c "failed")개
- 위험 점수: $(./scripts/risk-monitor.sh | grep "위험 점수" | cut -d':' -f2)

## 권장 조치
[자동 생성된 권장사항]
EOF
}
```

## 🎯 성공 지표

### Phase 0 완료 기준

- [ ] TypeScript 오류 < 10개
- [ ] 테스트 통과율 > 85%
- [ ] 빌드 성공
- [ ] API 응답시간 < 2초
- [ ] 자동화 스크립트 정상 작동

### 프로젝트 전체 성공 기준

- [ ] 모든 Phase 95% 이상 완료
- [ ] 성능 목표 달성 (execution-plan.md 기준)
- [ ] 비용 예산 80% 미만 사용
- [ ] 위험 점수 지속적으로 40 미만 유지

---

**긴급 상황 시 연락처**:

- 프로젝트 관리: execution-plan.md 섹션 10
- 기술 문서: IMPLEMENTATION_FEASIBILITY_ANALYSIS.md
- 위험 모니터링: `./scripts/risk-monitor.sh`
