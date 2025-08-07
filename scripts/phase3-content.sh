#!/bin/bash
# Phase 3 콘텐츠 자동 생성

echo "📝 Phase 3: 콘텐츠 생성 시작..."

# Claude API로 스토리 대량 생성
echo "💬 대화 콘텐츠 생성 중..."
node scripts/generate-story-content.js --conversations 100 --events 50 --quests 30

# 아트 에셋 프롬프트 생성
echo "🎨 아트 프롬프트 생성 중..."
node scripts/generate-art-prompts.js --characters 10 --backgrounds 20 --items 50

echo "✅ Phase 3 콘텐츠 생성 완료!"
