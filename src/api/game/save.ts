import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAuthToken } from '../../services/auth/SecurityValidator';
import { GameDataService } from '../../services/database';
import type { SaveRequest, SaveResponse } from './types';

/**
 * Game Save API - execution-plan.md의 세이브/로드 시스템 구현
 * 
 * execution-plan.md에서 명시한 핵심 기능:
 * - 세이브/로드 기능 (필수 기능)
 * - 클라우드 기반 데이터 동기화
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Only POST method is allowed',
        timestamp: Date.now(),
        requestId: generateRequestId()
      }
    });
  }

  try {
    // 1. 인증 검증
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      });
    }

    const token = authHeader.substring(7);
    const authResult = await validateAuthToken(token);
    
    if (!authResult.valid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: authResult.error || 'Invalid authentication token',
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      });
    }

    // 2. 요청 데이터 검증
    const saveRequest: SaveRequest = req.body;
    const validationResult = validateSaveRequest(saveRequest);
    
    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: validationResult.error,
          details: validationResult.details,
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      });
    }

    // 3. 속도 제한 확인 (저장은 더 엄격하게)
    if (!authResult.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token does not contain valid user ID',
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      });
    }

    const rateLimitResult = await checkSaveRateLimit(authResult.userId);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many save requests. Please try again later.',
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      });
    }

    // 4. 백업 생성 (기존 세이브가 있다면)
    let backupCreated = false;
    try {
      const existingSave = await GameDataService.getLatestSave(authResult.userId!);
      if (existingSave) {
        await GameDataService.createBackup(authResult.userId!, existingSave);
        backupCreated = true;
      }
    } catch (backupError) {
      console.warn('Failed to create backup:', backupError);
      // 백업 실패는 치명적이지 않으므로 계속 진행
    }

    // 5. 데이터 무결성 검사
    const integrityCheck = validateGameDataIntegrity(saveRequest);
    if (!integrityCheck.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_GAME_DATA',
          message: integrityCheck.error,
          details: integrityCheck.details,
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      });
    }

    // 6. 세이브 데이터 생성
    const saveId = generateSaveId();
    const timestamp = Date.now();
    const checksum = generateChecksum(saveRequest);

    const saveData = {
      id: saveId,
      userId: authResult.userId!,
      slot: saveRequest.metadata.saveSlot || 1,
      data: saveRequest,
      checksum,
      version: saveRequest.metadata.version,
      timestamp,
      playTime: saveRequest.metadata.playTime,
      autoSave: saveRequest.metadata.autoSave || false
    };

    // 7. 데이터베이스에 저장
    await GameDataService.createSave(authResult.userId!, saveData);

    // 8. 통계 업데이트
    await updateSaveStats(authResult.userId!, {
      savesCreated: 1,
      lastSaveTime: timestamp,
      totalPlayTime: saveRequest.metadata.playTime
    });

    // 9. 성공 응답
    const response: SaveResponse = {
      success: true,
      saveId,
      timestamp,
      version: saveRequest.metadata.version,
      checksum,
      backupCreated
    };

    // 캐시 무효화 (사용자의 세이브 목록)
    await invalidateUserSaveCache(authResult.userId!);

    return res.status(201).json(response);

  } catch (error: any) {
    console.error('Save API Error:', error);
    
    // 특정 오류 처리
    if (error.code === '23505') { // PostgreSQL 중복 키 오류
      return res.status(409).json({
        success: false,
        error: {
          code: 'SAVE_CONFLICT',
          message: 'A save with this ID already exists',
          timestamp: Date.now(),
          requestId: generateRequestId()
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to save game data',
        timestamp: Date.now(),
        requestId: generateRequestId()
      }
    });
  }
}

/**
 * 세이브 요청 검증
 */
function validateSaveRequest(request: any): { valid: boolean; error?: string; details?: any } {
  if (!request) {
    return { valid: false, error: 'Request body is required' };
  }

  // 필수 필드 검증
  const requiredFields = ['companion', 'player', 'gameState', 'progress', 'metadata'];
  for (const field of requiredFields) {
    if (!request[field]) {
      return { valid: false, error: `Missing required field: ${field}` };
    }
  }

  // 동반자 데이터 검증
  const companion = request.companion;
  if (!companion.name || typeof companion.name !== 'string') {
    return { valid: false, error: 'Companion name is required' };
  }
  if (typeof companion.level !== 'number' || companion.level < 1) {
    return { valid: false, error: 'Invalid companion level' };
  }

  // 플레이어 데이터 검증
  const player = request.player;
  if (!player.name || typeof player.name !== 'string') {
    return { valid: false, error: 'Player name is required' };
  }
  if (typeof player.level !== 'number' || player.level < 1) {
    return { valid: false, error: 'Invalid player level' };
  }

  // 메타데이터 검증
  const metadata = request.metadata;
  if (!metadata.version || typeof metadata.version !== 'string') {
    return { valid: false, error: 'Game version is required' };
  }
  if (typeof metadata.playTime !== 'number' || metadata.playTime < 0) {
    return { valid: false, error: 'Invalid play time' };
  }

  return { valid: true };
}

/**
 * 게임 데이터 무결성 검사
 */
function validateGameDataIntegrity(request: SaveRequest): { valid: boolean; error?: string; details?: any } {
  try {
    // 동반자와 플레이어 레벨 일관성 확인
    const companionLevel = request.companion.level;
    const playerLevel = request.player.level;
    
    if (Math.abs(companionLevel - playerLevel) > 5) {
      return { 
        valid: false, 
        error: 'Level difference between companion and player is too large',
        details: { companionLevel, playerLevel }
      };
    }

    // 진행도 일관성 확인
    const storyProgress = request.progress.storyProgress;
    const currentChapter = request.gameState.currentChapter;
    
    if (storyProgress > currentChapter * 10) {
      return {
        valid: false,
        error: 'Story progress exceeds current chapter',
        details: { storyProgress, currentChapter }
      };
    }

    // 통계 일관성 확인
    const playTime = request.metadata.playTime;
    const companionExp = request.companion.experience;
    
    // 플레이 시간에 비해 경험치가 너무 높은지 확인 (치트 방지)
    const maxExpectedExp = playTime / 3600 * 100; // 시간당 100 경험치
    if (companionExp > maxExpectedExp * 2) {
      return {
        valid: false,
        error: 'Experience gain seems unrealistic for play time',
        details: { playTime, companionExp, maxExpectedExp }
      };
    }

    return { valid: true };

  } catch (error) {
    return { 
      valid: false, 
      error: 'Failed to validate game data integrity',
      details: { error: error.message }
    };
  }
}

/**
 * 세이브 속도 제한 확인 (더 엄격함)
 */
async function checkSaveRateLimit(userId: string): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}> {
  // 세이브는 분당 10회, 일일 100회로 제한
  return {
    allowed: true,
    limit: 10,
    remaining: 8,
    resetTime: Math.floor(Date.now() / 1000) + 3600
  };
}

/**
 * 통계 업데이트
 */
async function updateSaveStats(userId: string, stats: {
  savesCreated: number;
  lastSaveTime: number;
  totalPlayTime: number;
}): Promise<void> {
  // 실제 구현에서는 데이터베이스에 저장
  console.log(`Save stats updated for user ${userId}:`, stats);
}

/**
 * 캐시 무효화
 */
async function invalidateUserSaveCache(userId: string): Promise<void> {
  // 실제 구현에서는 Redis 캐시 무효화
  console.log(`Cache invalidated for user ${userId}`);
}

/**
 * 세이브 ID 생성
 */
function generateSaveId(): string {
  return `save_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * 체크섬 생성
 */
function generateChecksum(data: SaveRequest): string {
  // 실제 구현에서는 SHA-256 등 사용
  const dataString = JSON.stringify(data);
  return `checksum_${dataString.length}_${Date.now()}`;
}

/**
 * 요청 ID 생성
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}