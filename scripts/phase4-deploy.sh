#!/bin/bash
# Phase 4 배포 자동화

echo "🚀 Phase 4: 배포 준비 시작..."

# 환경 변수 검증
echo "🔐 환경 변수 검증 중..."
npm run validate:env

# 빌드 최적화
echo "📦 프로덕션 빌드 중..."
npm run build

# 번들 분석
echo "📊 번들 크기 분석 중..."
npm run analyze

# Vercel 배포
echo "🚀 Vercel 배포 중..."
npm run deploy:vercel

echo "✅ Phase 4 배포 완료!"
