#!/usr/bin/env node

/**
 * 스토리 콘텐츠 자동 생성 스크립트
 * execution-plan.md 기반으로 대화, 이벤트, 퀘스트 생성
 */

import fs from 'fs/promises'
import path from 'path'
import { getAIManager } from '../src/services/ai/AIManager.js'

// 명령행 인자 파싱
function parseArgs(args) {
  const parsed = {
    conversations: 100,
    events: 50,
    quests: 30
  }
  
  args.forEach((arg, index) => {
    if (arg === '--conversations' && args[index + 1]) {
      parsed.conversations = parseInt(args[index + 1])
    } else if (arg === '--events' && args[index + 1]) {
      parsed.events = parseInt(args[index + 1])
    } else if (arg === '--quests' && args[index + 1]) {
      parsed.quests = parseInt(args[index + 1])
    }
  })
  
  return parsed
}

async function generateStoryContent(args) {
  const config = parseArgs(args)
  const aiManager = getAIManager()
  
  console.log(`📝 스토리 콘텐츠 생성 시작...`)
  console.log(`  - 대화: ${config.conversations}개`)
  console.log(`  - 이벤트: ${config.events}개`)
  console.log(`  - 퀘스트: ${config.quests}개`)
  
  try {
    // 1. 대화 콘텐츠 생성
    console.log('\n💬 대화 콘텐츠 생성 중...')
    const conversationPrompt = `
Generate ${config.conversations} daily conversation starters for a Korean AI companion RPG "소울메이트".

Context:
- Setting: Modern fantasy Korea with magic elements
- Companion: AI with emotions, personality, and growth
- Player: Young adult exploring relationships and adventures
- Tone: Warm, friendly, sometimes playful or emotional

Each conversation should include:
1. Various times of day (morning, afternoon, evening, night)
2. Different relationship levels (1-10)
3. Multiple moods and contexts
4. Player response options (3 each)
5. Natural Korean language with appropriate honorifics

Format exactly as JSON array:
[{
  "id": "daily_001",
  "timeOfDay": "morning|afternoon|evening|night",
  "minRelationship": 1-10,
  "companionMood": "happy|neutral|sad|excited|worried|loving|tired",
  "trigger": "time|mood|event|random",
  "tags": ["casual", "emotional", "funny", "romantic", "adventure"],
  "dialogue": "AI companion's opening line in natural Korean",
  "playerOptions": [
    "Response option 1",
    "Response option 2", 
    "Response option 3"
  ],
  "responses": {
    "option1": "AI's response to option 1",
    "option2": "AI's response to option 2",
    "option3": "AI's response to option 3"
  },
  "effects": {
    "option1": { "points": 5, "mood": "happy" },
    "option2": { "points": 10, "mood": "neutral" },
    "option3": { "points": 3, "mood": "sad" }
  }
}]

Important guidelines:
- Use natural, conversational Korean
- Vary emotional depth based on relationship level
- Include cute/playful elements for lighter moods
- Add deeper, meaningful conversations for higher levels
- Reference Korean culture, food, places naturally
- Some conversations should lead to adventures or events`

    const conversationResponse = await aiManager.generateResponse({
      messages: [{
        role: 'system',
        content: conversationPrompt
      }],
      provider: 'claude'
    })
    
    await fs.mkdir('./src/data', { recursive: true })
    await fs.writeFile(
      './src/data/conversations.json',
      conversationResponse.text
    )
    console.log('✅ 대화 콘텐츠 생성 완료')
    
    // 2. 이벤트 스토리 생성
    console.log('\n🎭 이벤트 스토리 생성 중...')
    const eventPrompt = `
Generate ${config.events} special event stories for the Korean AI companion RPG "소울메이트".

Event categories:
1. Seasonal events (봄꽃 축제, 여름 바다, 가을 단풍, 겨울 눈)
2. Relationship milestones (first meeting, becoming friends, confession)
3. Adventure events (dungeon discovery, treasure hunt, mysterious encounters)
4. Daily life events (cooking together, shopping, studying)
5. Emotional events (comforting, celebrating, arguing & making up)
6. Korean cultural events (추석, 설날, 빼빼로데이, 크리스마스)

Format as JSON array:
[{
  "id": "event_001",
  "name": "Event name in Korean",
  "category": "seasonal|milestone|adventure|daily|emotional|cultural",
  "requiredLevel": 1-10,
  "duration": "single|multi-part",
  "description": "Brief description of the event",
  "startDialogue": ["Opening dialogue line 1", "line 2", "..."],
  "stages": [{
    "id": "stage_1",
    "narrative": "What happens in this stage",
    "dialogue": ["Character dialogue"],
    "choices": [{
      "text": "Player choice",
      "outcome": "What happens",
      "effects": { "points": 20, "mood": "happy", "unlock": "item_or_memory" }
    }]
  }],
  "rewards": {
    "points": 50,
    "items": ["special_item"],
    "memories": ["특별한 추억"],
    "achievement": "achievement_id"
  },
  "specialRequirements": {
    "season": "spring|summer|fall|winter",
    "mood": "specific_mood",
    "items": ["required_items"]
  }
}]

Make events emotionally engaging and culturally relevant to Korean players.`

    const eventResponse = await aiManager.generateResponse({
      messages: [{
        role: 'system',
        content: eventPrompt
      }],
      provider: 'claude'
    })
    
    await fs.writeFile(
      './src/data/events.json',
      eventResponse.text
    )
    console.log('✅ 이벤트 스토리 생성 완료')
    
    // 3. 퀘스트 시스템 생성
    console.log('\n⚔️ 퀘스트 생성 중...')
    const questPrompt = `
Generate ${config.quests} quests for the Korean AI companion RPG "소울메이트".

Quest types:
1. Main story quests (finding companion's lost memories)
2. Relationship quests (deepening bonds, special dates)
3. Adventure quests (exploring dungeons, defeating monsters)
4. Collection quests (gathering items, ingredients)
5. Social quests (helping NPCs, community events)
6. Daily quests (simple repeatable tasks)

Format as JSON array:
[{
  "id": "quest_001",
  "name": "Quest name in Korean",
  "type": "main|relationship|adventure|collection|social|daily",
  "difficulty": "easy|normal|hard|epic",
  "minLevel": 1-10,
  "description": "Quest description explaining the goal",
  "giver": "npc_name or companion",
  "dialogue": {
    "start": ["Quest introduction dialogue"],
    "progress": ["Dialogue during quest"],
    "complete": ["Completion dialogue"]
  },
  "objectives": [{
    "id": "obj_1",
    "description": "What to do",
    "type": "talk|collect|defeat|explore|deliver",
    "target": "target_name",
    "count": 1,
    "location": "location_name"
  }],
  "rewards": {
    "exp": 100,
    "gold": 500,
    "items": [{ "id": "item_id", "name": "아이템 이름", "count": 1 }],
    "relationshipPoints": 30,
    "unlocks": ["next_quest_id"]
  },
  "prerequisites": {
    "quests": ["required_quest_ids"],
    "level": 1,
    "relationship": 1,
    "items": ["required_items"]
  },
  "repeatable": false,
  "timeLimit": null
}]

Create engaging quests that strengthen the companion relationship while providing adventure.`

    const questResponse = await aiManager.generateResponse({
      messages: [{
        role: 'system',
        content: questPrompt
      }],
      provider: 'claude'
    })
    
    await fs.writeFile(
      './src/data/quests.json',
      questResponse.text
    )
    console.log('✅ 퀘스트 생성 완료')
    
    // 4. 아이템 설명 생성
    console.log('\n💎 아이템 생성 중...')
    const itemPrompt = `
Generate 50 items for the Korean AI companion RPG "소울메이트".

Item categories:
1. Gifts (flowers, accessories, food, books)
2. Combat items (weapons, armor, potions)
3. Quest items (keys, letters, artifacts)
4. Crafting materials (herbs, gems, fabrics)
5. Special items (memory fragments, relationship tokens)

Format as JSON array:
[{
  "id": "item_001",
  "name": "Item name in Korean",
  "category": "gift|combat|quest|material|special",
  "rarity": "common|uncommon|rare|epic|legendary",
  "description": "Flavorful description in Korean",
  "effects": {
    "hp": 0,
    "mp": 0,
    "relationshipPoints": 0,
    "buff": "buff_description"
  },
  "value": 100,
  "sellable": true,
  "giftable": true,
  "companionReaction": {
    "love": ["character_ids_who_love_this"],
    "like": ["character_ids_who_like_this"],
    "dislike": ["character_ids_who_dislike_this"]
  },
  "obtainMethod": "shop|drop|craft|quest|event",
  "craftingRecipe": {
    "materials": [{ "id": "material_id", "count": 2 }],
    "craftingLevel": 1
  }
}]`

    const itemResponse = await aiManager.generateResponse({
      messages: [{
        role: 'system',
        content: itemPrompt
      }],
      provider: 'claude'
    })
    
    await fs.writeFile(
      './src/data/items.json',
      itemResponse.text
    )
    console.log('✅ 아이템 생성 완료')
    
    // 5. 장소/지역 설명 생성
    console.log('\n🗺️ 지역 정보 생성 중...')
    const locationPrompt = `
Generate 30 locations for the Korean AI companion RPG "소울메이트" set in modern fantasy Korea.

Location types:
1. City areas (명동, 강남, 홍대 - with fantasy twists)
2. Natural areas (설악산 magic forest, 제주도 dragon coast)
3. Dungeons (abandoned subway tunnels, haunted buildings)
4. Social spaces (카페, 편의점, PC방 with magical elements)
5. Special locations (companion's secret garden, memory palace)

Format as JSON array:
[{
  "id": "loc_001",
  "name": "Location name",
  "koreanName": "한국어 이름",
  "type": "city|nature|dungeon|social|special",
  "description": "Atmospheric description mixing modern Korea with fantasy",
  "backgroundImage": "location_bg_001.jpg",
  "musicTheme": "peaceful|mysterious|dangerous|romantic|energetic",
  "activities": [
    "talk", "shop", "battle", "explore", "date", "quest"
  ],
  "npcs": ["npc_ids_found_here"],
  "monsters": ["monster_ids_if_any"],
  "shops": ["shop_ids_if_any"],
  "connectionTo": ["connected_location_ids"],
  "requirements": {
    "level": 1,
    "relationship": 1,
    "quests": ["required_quest_ids"],
    "time": "day|night|any"
  },
  "specialEvents": [{
    "id": "event_id",
    "trigger": "first_visit|date|time|random",
    "description": "What happens"
  }]
}]`

    const locationResponse = await aiManager.generateResponse({
      messages: [{
        role: 'system',
        content: locationPrompt
      }],
      provider: 'claude'
    })
    
    await fs.writeFile(
      './src/data/locations.json',
      locationResponse.text
    )
    console.log('✅ 지역 정보 생성 완료')
    
    // 6. 스토리 요약 파일 생성
    const summaryContent = `# 소울메이트 스토리 콘텐츠 요약

## 생성된 콘텐츠
- 대화: ${config.conversations}개
- 이벤트: ${config.events}개
- 퀘스트: ${config.quests}개
- 아이템: 50개
- 지역: 30개

## 주요 테마
1. **관계 발전**: 첫 만남부터 소울메이트까지의 여정
2. **한국 문화**: 현대 한국 배경에 판타지 요소 융합
3. **감정적 교감**: AI 동반자와의 깊은 감정적 연결
4. **모험과 성장**: 함께하는 모험을 통한 성장
5. **일상과 특별함**: 평범한 일상 속 특별한 순간들

## 게임 플로우
1. 캐릭터 선택 → 첫 만남 이벤트
2. 일상 대화와 퀘스트로 관계 발전
3. 특별 이벤트로 관계 심화
4. 메인 스토리 진행 (동반자의 과거 탐색)
5. 최종 선택 (다양한 엔딩)

생성 시간: ${new Date().toLocaleString('ko-KR')}`

    await fs.writeFile(
      './src/data/CONTENT_SUMMARY.md',
      summaryContent
    )
    
    console.log('\n🎉 모든 스토리 콘텐츠 생성 완료!')
    console.log('생성된 파일:')
    console.log('  - /src/data/conversations.json')
    console.log('  - /src/data/events.json')
    console.log('  - /src/data/quests.json')
    console.log('  - /src/data/items.json')
    console.log('  - /src/data/locations.json')
    console.log('  - /src/data/CONTENT_SUMMARY.md')
    
  } catch (error) {
    console.error('❌ 스토리 콘텐츠 생성 중 오류:', error)
    process.exit(1)
  }
}

// 실행
generateStoryContent(process.argv.slice(2))