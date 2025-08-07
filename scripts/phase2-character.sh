#!/bin/bash
# Phase 2 캐릭터 시스템 자동 구현

echo "🎮 Phase 2: 캐릭터 시스템 구현 시작..."

# 캐릭터 관련 컴포넌트 생성
echo "📦 컴포넌트 생성 중..."
node scripts/generate-component.js CharacterProfile character
node scripts/generate-component.js InventorySystem character
node scripts/generate-component.js SkillTree character
node scripts/generate-component.js RelationshipTracker character

# AI 캐릭터 성격 시스템 확장
echo "🧠 AI 성격 시스템 생성 중..."
node scripts/generate-character-system.js

# 관계도 시스템 구현
echo "💕 관계 시스템 구현 중..."
node scripts/implement-relationship.js

echo "✅ Phase 2 캐릭터 시스템 완료!"
