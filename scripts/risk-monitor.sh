#!/bin/bash

# 🚨 소울메이트 프로젝트 위험 모니터링 스크립트
# execution-plan.md 위험 완화 전략 구현

set -e

# 색상 코드
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 위험도 계산 함수
calculate_risk_score() {
    local ts_errors=$(npm run type-check 2>&1 | grep -c "error" || echo "0")
    local test_failures=$(npm test 2>&1 | grep -c "failed" || echo "0")
    local api_response_time=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:3000/api/health || echo "10")
    
    # 위험 점수 계산 (0-100)
    local risk_score=0
    
    # TypeScript 오류 (최대 40점)
    if [ "$ts_errors" -gt 100 ]; then
        risk_score=$((risk_score + 40))
    elif [ "$ts_errors" -gt 50 ]; then
        risk_score=$((risk_score + 25))
    elif [ "$ts_errors" -gt 20 ]; then
        risk_score=$((risk_score + 15))
    elif [ "$ts_errors" -gt 0 ]; then
        risk_score=$((risk_score + 5))
    fi
    
    # 테스트 실패 (최대 30점)
    if [ "$test_failures" -gt 20 ]; then
        risk_score=$((risk_score + 30))
    elif [ "$test_failures" -gt 10 ]; then
        risk_score=$((risk_score + 20))
    elif [ "$test_failures" -gt 5 ]; then
        risk_score=$((risk_score + 10))
    elif [ "$test_failures" -gt 0 ]; then
        risk_score=$((risk_score + 5))
    fi
    
    # API 응답 시간 (최대 30점)
    if (( $(echo "$api_response_time > 5" | bc -l) )); then
        risk_score=$((risk_score + 30))
    elif (( $(echo "$api_response_time > 3" | bc -l) )); then
        risk_score=$((risk_score + 20))
    elif (( $(echo "$api_response_time > 2" | bc -l) )); then
        risk_score=$((risk_score + 10))
    fi
    
    echo $risk_score
}

# 기술 부채 모니터링
check_technical_debt() {
    log_info "🔍 기술 부채 상태 확인 중..."
    
    # TypeScript 오류 확인
    local ts_errors=$(npm run type-check 2>&1 | grep -c "error" || echo "0")
    log_info "TypeScript 오류: $ts_errors개"
    
    if [ "$ts_errors" -gt 50 ]; then
        log_error "🚨 CRITICAL: TypeScript 오류가 50개를 초과했습니다!"
        return 1
    elif [ "$ts_errors" -gt 20 ]; then
        log_warn "⚠️  WARNING: TypeScript 오류가 20개를 초과했습니다."
    elif [ "$ts_errors" -eq 0 ]; then
        log_success "✅ TypeScript 오류 없음"
    fi
    
    # 테스트 상태 확인
    local test_result=$(npm test 2>&1 || echo "FAILED")
    local test_failures=$(echo "$test_result" | grep -c "failed" || echo "0")
    
    log_info "테스트 실패: $test_failures개"
    
    if [ "$test_failures" -gt 10 ]; then
        log_error "🚨 CRITICAL: 테스트 실패가 10개를 초과했습니다!"
        return 1
    elif [ "$test_failures" -gt 5 ]; then
        log_warn "⚠️  WARNING: 테스트 실패가 5개를 초과했습니다."
    elif [ "$test_failures" -eq 0 ]; then
        log_success "✅ 모든 테스트 통과"
    fi
    
    return 0
}

# 외부 의존성 상태 확인
check_external_dependencies() {
    log_info "🌐 외부 의존성 상태 확인 중..."
    
    # Claude API 상태
    if curl -s --fail "https://api.anthropic.com/v1/messages" -H "Authorization: Bearer $CLAUDE_API_KEY" >/dev/null 2>&1; then
        log_success "✅ Claude API 정상"
    else
        log_error "🚨 Claude API 응답 없음 - Fallback 모드 활성화 필요"
    fi
    
    # Supabase 상태
    if curl -s --fail "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY" >/dev/null 2>&1; then
        log_success "✅ Supabase 정상"
    else
        log_error "🚨 Supabase 응답 없음 - 로컬 스토리지 모드 활성화 필요"
    fi
    
    # API 응답 시간 측정
    local response_time=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:3000/api/health || echo "10")
    log_info "API 응답 시간: ${response_time}초"
    
    if (( $(echo "$response_time > 3" | bc -l) )); then
        log_error "🚨 CRITICAL: API 응답 시간이 3초를 초과했습니다!"
        return 1
    elif (( $(echo "$response_time > 2" | bc -l) )); then
        log_warn "⚠️  WARNING: API 응답 시간이 2초를 초과했습니다."
    else
        log_success "✅ API 응답 시간 정상"
    fi
    
    return 0
}

# 비용 모니터링
check_cost_usage() {
    log_info "💰 비용 사용량 확인 중..."
    
    # 현재 월의 시작일 계산
    local current_month=$(date +"%Y-%m")
    local cost_file="/tmp/monthly_cost_${current_month}.txt"
    
    # 모의 비용 데이터 (실제 구현에서는 API 연동)
    local estimated_cost=$(echo "scale=2; $(date +%d) * 2.5" | bc)
    
    log_info "이번 달 예상 비용: $${estimated_cost}"
    
    if (( $(echo "$estimated_cost > 80" | bc -l) )); then
        log_error "🚨 CRITICAL: 월 비용이 $80를 초과했습니다!"
        log_info "캐싱 강화 모드를 활성화합니다..."
        return 1
    elif (( $(echo "$estimated_cost > 60" | bc -l) )); then
        log_warn "⚠️  WARNING: 월 비용이 $60를 초과했습니다."
    else
        log_success "✅ 비용 사용량 정상"
    fi
    
    return 0
}

# 자동화 스크립트 상태 확인
check_automation_status() {
    log_info "🤖 자동화 스크립트 상태 확인 중..."
    
    # Phase 2 스크립트 확인
    if [ -f "scripts/phase2-character.sh" ] && [ -x "scripts/phase2-character.sh" ]; then
        if npm run phase2:character --dry-run >/dev/null 2>&1; then
            log_success "✅ Phase 2 캐릭터 자동화 준비됨"
        else
            log_error "🚨 Phase 2 캐릭터 자동화 실패"
        fi
    else
        log_warn "⚠️  Phase 2 캐릭터 스크립트 누락"
    fi
    
    if [ -f "scripts/phase2-battle.sh" ] && [ -x "scripts/phase2-battle.sh" ]; then
        if npm run phase2:battle --dry-run >/dev/null 2>&1; then
            log_success "✅ Phase 2 전투 자동화 준비됨"
        else
            log_error "🚨 Phase 2 전투 자동화 실패"
        fi
    else
        log_warn "⚠️  Phase 2 전투 스크립트 누락"
    fi
}

# 위험 대응 자동화
auto_risk_response() {
    local risk_score=$1
    
    log_info "🎯 위험 점수: $risk_score/100"
    
    if [ "$risk_score" -gt 70 ]; then
        log_error "🚨 HIGH RISK: 즉시 대응 필요!"
        
        # 자동 대응 조치
        log_info "자동 대응 조치 실행 중..."
        
        # 1. 현재 상태 백업
        git add . && git commit -m "Emergency backup before risk mitigation" || true
        
        # 2. 캐시 정리
        npm run clean-cache || true
        
        # 3. 의존성 재설치
        npm ci || true
        
        # 4. 알림 전송 (실제 환경에서는 Slack/Discord 등)
        echo "HIGH RISK detected at $(date)" >> /tmp/risk_alerts.log
        
        log_info "자동 대응 조치 완료. 수동 검토가 필요합니다."
        
    elif [ "$risk_score" -gt 40 ]; then
        log_warn "⚠️  MEDIUM RISK: 모니터링 강화"
        
        # 경고 단계 대응
        log_info "모니터링 강화 모드 활성화..."
        
        # 더 자주 체크하도록 설정
        echo "MEDIUM_RISK_MODE=true" > /tmp/risk_mode.env
        
    else
        log_success "✅ LOW RISK: 정상 모니터링 지속"
        
        # 정상 상태 - 위험 모드 비활성화
        rm -f /tmp/risk_mode.env 2>/dev/null || true
    fi
}

# 리포트 생성
generate_risk_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local report_file="/tmp/risk_report_$(date +%Y%m%d_%H%M%S).json"
    
    # JSON 리포트 생성
    cat > "$report_file" << EOF
{
  "timestamp": "$timestamp",
  "riskScore": $(calculate_risk_score),
  "technicalDebt": {
    "typeScriptErrors": $(npm run type-check 2>&1 | grep -c "error" || echo "0"),
    "testFailures": $(npm test 2>&1 | grep -c "failed" || echo "0")
  },
  "externalDependencies": {
    "apiResponseTime": $(curl -w "%{time_total}" -s -o /dev/null http://localhost:3000/api/health || echo "10")
  },
  "estimatedMonthlyCost": $(echo "scale=2; $(date +%d) * 2.5" | bc),
  "automationStatus": {
    "phase2Ready": $([ -f "scripts/phase2-character.sh" ] && echo "true" || echo "false")
  }
}
EOF
    
    log_info "위험 리포트 생성: $report_file"
    echo "$report_file"
}

# 메인 실행 함수
main() {
    echo "=============================================="
    echo "🚨 소울메이트 프로젝트 위험 모니터링"
    echo "시작 시간: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "=============================================="
    
    local overall_status=0
    
    # 각 영역별 위험 체크
    check_technical_debt || overall_status=1
    echo ""
    
    check_external_dependencies || overall_status=1
    echo ""
    
    check_cost_usage || overall_status=1
    echo ""
    
    check_automation_status
    echo ""
    
    # 종합 위험 점수 계산 및 대응
    local risk_score=$(calculate_risk_score)
    auto_risk_response "$risk_score"
    
    echo ""
    echo "=============================================="
    
    # 리포트 생성
    local report_file=$(generate_risk_report)
    
    if [ $overall_status -eq 0 ]; then
        log_success "✅ 전체 위험 상태: 정상"
        echo "다음 체크 권장 시간: $(date -d '+1 hour' '+%H:%M')"
    else
        log_error "🚨 위험 요소 발견! 즉시 대응이 필요합니다."
        echo "긴급 대응 가이드: execution-plan.md 섹션 10 참조"
    fi
    
    echo "상세 리포트: $report_file"
    echo "=============================================="
    
    return $overall_status
}

# 스크립트 실행
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi