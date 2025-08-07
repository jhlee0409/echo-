#!/usr/bin/env node

/**
 * 아트 프롬프트 자동 생성 스크립트
 * Midjourney, DALL-E 등을 위한 프롬프트 생성
 */

import fs from 'fs/promises'
import path from 'path'

// 명령행 인자 파싱
function parseArgs(args) {
  const parsed = {
    characters: 10,
    backgrounds: 20,
    items: 50
  }
  
  args.forEach((arg, index) => {
    if (arg === '--characters' && args[index + 1]) {
      parsed.characters = parseInt(args[index + 1])
    } else if (arg === '--backgrounds' && args[index + 1]) {
      parsed.backgrounds = parseInt(args[index + 1])
    } else if (arg === '--items' && args[index + 1]) {
      parsed.items = parseInt(args[index + 1])
    }
  })
  
  return parsed
}

async function generateArtPrompts(args) {
  const config = parseArgs(args)
  
  console.log('🎨 아트 프롬프트 생성 시작...')
  console.log(`  - 캐릭터: ${config.characters}개`)
  console.log(`  - 배경: ${config.backgrounds}개`)
  console.log(`  - 아이템: ${config.items}개`)
  
  try {
    // 1. 캐릭터 프롬프트 생성
    const characterPrompts = []
    
    // 메인 캐릭터들 (AI 동반자)
    const companionTypes = [
      { name: '루나', style: 'cheerful girl with mint gradient hair, bright eyes' },
      { name: '아리아', style: 'elegant girl with silver hair, mysterious aura' },
      { name: '유나', style: 'energetic girl with pink twin-tails, playful expression' },
      { name: '사라', style: 'calm girl with blue hair, gentle smile' },
      { name: '미나', style: 'shy girl with brown hair, cute accessories' }
    ]
    
    for (const companion of companionTypes) {
      characterPrompts.push({
        id: `companion_${companion.name.toLowerCase()}`,
        name: companion.name,
        category: 'companion',
        prompts: {
          midjourney: `anime style AI companion girl, ${companion.style}, game character design, clean background, high quality --ar 3:4 --v 6`,
          dalle: `Anime-style AI companion character named ${companion.name}. ${companion.style}. Game character design for Korean RPG. Clean, professional anime art style with vibrant colors.`,
          stablediffusion: `anime, game character, AI companion, ${companion.style}, detailed face, vibrant colors, high quality, masterpiece`
        },
        expressions: [
          'happy', 'sad', 'excited', 'worried', 'loving', 'tired', 'surprised', 'angry'
        ].map(emotion => ({
          emotion,
          midjourney: `anime style ${companion.name}, ${companion.style}, ${emotion} expression, game portrait --ar 1:1 --v 6`,
          dalle: `Anime portrait of ${companion.name} with ${emotion} expression. ${companion.style}. Game character art for Korean RPG.`
        }))
      })
    }
    
    // 2. 배경 프롬프트 생성
    const backgroundPrompts = []
    
    const backgroundTypes = [
      // 현대 한국 + 판타지
      { name: '명동 마법거리', desc: 'Myeongdong street with magical elements, neon signs, Korean modern fantasy' },
      { name: '강남 스카이라인', desc: 'Gangnam skyline at sunset with floating magical crystals, cyberpunk fantasy' },
      { name: '홍대 마법카페', desc: 'Hongdae magical cafe interior, cozy atmosphere with floating books and glowing potions' },
      { name: '한강 드래곤브릿지', desc: 'Han River with dragon bridge, magical aurora in the sky, Korean landscape fantasy' },
      { name: '경복궁 시간문', desc: 'Gyeongbokgung Palace with time portal, traditional Korean architecture meets magic' },
      
      // 던전/모험 지역
      { name: '지하철 던전', desc: 'Abandoned subway tunnel dungeon, mysterious lighting, urban fantasy atmosphere' },
      { name: '63빌딩 마법탑', desc: '63 Building transformed into magical tower, glowing windows, aerial view' },
      { name: '설악산 마법숲', desc: 'Seorak Mountain magical forest, glowing trees, mystical Korean nature' },
      { name: '제주도 용궁', desc: 'Jeju Island dragon palace underwater, Korean mythology meets fantasy' },
      { name: '인사동 고서점', desc: 'Insadong antique bookstore with magical books, traditional Korean interior' }
    ]
    
    for (const bg of backgroundTypes.slice(0, config.backgrounds)) {
      backgroundPrompts.push({
        id: `bg_${bg.name.replace(/\s+/g, '_').toLowerCase()}`,
        name: bg.name,
        category: 'background',
        prompts: {
          midjourney: `${bg.desc}, Korean modern fantasy, game background art, detailed environment --ar 16:9 --v 6`,
          dalle: `Game background art: ${bg.desc}. Korean modern fantasy setting for RPG game. High quality digital art with rich details.`,
          stablediffusion: `game background, Korean fantasy, ${bg.desc}, detailed environment, high quality, cinematic lighting`
        }
      })
    }
    
    // 3. 아이템 프롬프트 생성
    const itemPrompts = []
    
    const itemTypes = [
      // 무기
      { name: '한국검', category: 'weapon', desc: 'traditional Korean sword with magical glow' },
      { name: '마법부채', category: 'weapon', desc: 'magical Korean folding fan with wind effects' },
      { name: '봉황활', category: 'weapon', desc: 'phoenix bow with fire elements' },
      
      // 방어구
      { name: '한복갑옷', category: 'armor', desc: 'hanbok-inspired magical armor' },
      { name: '호랑이방패', category: 'armor', desc: 'tiger spirit shield with Korean patterns' },
      
      // 소비 아이템
      { name: '김치포션', category: 'consumable', desc: 'kimchi healing potion in glass bottle' },
      { name: '인삼엘릭서', category: 'consumable', desc: 'ginseng elixir with glowing effects' },
      { name: '떡케이크', category: 'consumable', desc: 'rice cake with magical sparkles' },
      
      // 선물 아이템
      { name: '장미꽃다발', category: 'gift', desc: 'beautiful rose bouquet with ribbon' },
      { name: '한국전통차', category: 'gift', desc: 'traditional Korean tea set' },
      { name: '커플링', category: 'gift', desc: 'matching couple rings with heart design' },
      { name: '초콜릿상자', category: 'gift', desc: 'heart-shaped chocolate box' },
      
      // 마법 아이템
      { name: '용구슬', category: 'magic', desc: 'dragon orb with swirling energy' },
      { name: '달토끼부적', category: 'magic', desc: 'moon rabbit charm with lunar magic' },
      { name: '사랑의묘약', category: 'magic', desc: 'love potion in heart-shaped bottle' }
    ]
    
    for (const item of itemTypes.slice(0, config.items)) {
      itemPrompts.push({
        id: `item_${item.name.replace(/\s+/g, '_').toLowerCase()}`,
        name: item.name,
        category: item.category,
        prompts: {
          midjourney: `game item icon, ${item.desc}, Korean RPG style, clean background, high detail --ar 1:1 --v 6`,
          dalle: `Game item icon: ${item.desc}. Korean RPG style item for inventory. Clean design with transparent background.`,
          stablediffusion: `game item, ${item.desc}, RPG item design, high quality, clean background, detailed`
        }
      })
    }
    
    // 4. 프롬프트 파일 저장
    const allPrompts = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalPrompts: characterPrompts.length + backgroundPrompts.length + itemPrompts.length,
        categories: {
          characters: characterPrompts.length,
          backgrounds: backgroundPrompts.length,
          items: itemPrompts.length
        }
      },
      characters: characterPrompts,
      backgrounds: backgroundPrompts,
      items: itemPrompts
    }
    
    await fs.mkdir('./src/data', { recursive: true })
    await fs.writeFile(
      './src/data/art-prompts.json',
      JSON.stringify(allPrompts, null, 2)
    )
    
    // 5. Markdown 가이드 생성
    const guideContent = `# 소울메이트 아트 생성 가이드

## 생성된 프롬프트 수
- 캐릭터: ${characterPrompts.length}개 (표정 변화 포함)
- 배경: ${backgroundPrompts.length}개
- 아이템: ${itemPrompts.length}개

## AI 아트 플랫폼별 사용법

### Midjourney
1. Discord에서 \`/imagine\` 명령어 사용
2. 프롬프트 끝에 \`--ar 16:9\` (배경) 또는 \`--ar 1:1\` (아이템, 초상화)
3. \`--v 6\` 버전 지정으로 최신 품질 보장

### DALL-E 3
1. ChatGPT 또는 Bing Image Creator 사용
2. 프롬프트를 그대로 복사하여 입력
3. 1024x1024 해상도 권장

### Stable Diffusion
1. ComfyUI 또는 Automatic1111 사용
2. Negative prompt: \`low quality, blurry, pixelated\`
3. Steps: 20-30, CFG: 7-8

## 파일 구조 권장사항

\`\`\`
/public/assets/
  /characters/
    /companions/
      luna.png
      luna_happy.png
      luna_sad.png
      ...
  /backgrounds/
    myeongdong_magic_street.jpg
    gangnam_skyline.jpg
    ...
  /items/
    /weapons/
    /armor/
    /consumables/
    /gifts/
    /magic/
\`\`\`

## 스타일 가이드

### 캐릭터
- 애니메이션 스타일 (일본 애니메이션 + 한국적 감성)
- 밝고 생동감 있는 색상
- 표정과 감정이 명확하게 드러나는 디자인
- 현대적이면서도 친근한 느낌

### 배경
- 한국의 실제 장소에 판타지 요소 추가
- 게임 플레이에 방해되지 않는 색조
- 아늑하고 몰입감 있는 분위기

### 아이템
- 명확하고 직관적인 디자인
- 투명 배경으로 UI 통합 용이성
- 한국 문화 요소 반영

생성 일시: ${new Date().toLocaleString('ko-KR')}
`

    await fs.writeFile(
      './src/data/ART_GENERATION_GUIDE.md',
      guideContent
    )
    
    // 6. 배치 실행 스크립트 (선택사항)
    const batchScript = `#!/bin/bash
# 아트 생성 배치 스크립트 (수동 실행용)

echo "🎨 소울메이트 아트 에셋 생성 시작..."
echo "이 스크립트는 AI 아트 플랫폼에서 수동으로 생성해야 합니다."
echo ""
echo "1. art-prompts.json 파일의 프롬프트를 복사"
echo "2. Midjourney, DALL-E, Stable Diffusion에서 생성"
echo "3. 생성된 이미지를 /public/assets/ 폴더에 저장"
echo ""
echo "자세한 가이드: ART_GENERATION_GUIDE.md 참고"
`

    await fs.writeFile(
      './scripts/generate-art-assets.sh',
      batchScript,
      { mode: 0o755 }
    )
    
    console.log('\n🎨 아트 프롬프트 생성 완료!')
    console.log('생성된 파일:')
    console.log('  - /src/data/art-prompts.json')
    console.log('  - /src/data/ART_GENERATION_GUIDE.md')
    console.log('  - /scripts/generate-art-assets.sh')
    
    console.log('\n📝 다음 단계:')
    console.log('  1. art-prompts.json의 프롬프트를 AI 아트 플랫폼에서 사용')
    console.log('  2. 생성된 이미지를 /public/assets/ 폴더에 저장')
    console.log('  3. 파일명을 JSON의 id와 일치시키기')
    
  } catch (error) {
    console.error('❌ 아트 프롬프트 생성 중 오류:', error)
    process.exit(1)
  }
}

// 실행
generateArtPrompts(process.argv.slice(2))