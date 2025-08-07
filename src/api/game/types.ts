/**
 * Game API 타입 정의
 * execution-plan.md의 게임 데이터 구조 기반
 */

export interface SaveRequest {
  companion: {
    name: string;
    level: number;
    experience: number;
    stats: {
      health: number;
      energy: number;
      happiness: number;
      intelligence: number;
      creativity: number;
      empathy: number;
    };
    personality: {
      cheerful: number;
      careful: number;
      curious: number;
      emotional: number;
      independent: number;
      playful: number;
      supportive: number;
    };
    currentEmotion: string;
    avatar: {
      appearance: string;
      outfit: string;
      accessories: string[];
    };
    inventory: Array<{
      id: string;
      name: string;
      type: string;
      quantity: number;
      description: string;
    }>;
    relationships: {
      withPlayer: {
        level: number;
        intimacy: number;
        trust: number;
        affection: number;
      };
      memories: Array<{
        id: string;
        content: string;
        importance: number;
        timestamp: number;
        tags: string[];
      }>;
    };
  };
  player: {
    name: string;
    level: number;
    experience: number;
    stats: {
      charisma: number;
      intelligence: number;
      creativity: number;
      empathy: number;
    };
    inventory: Array<{
      id: string;
      name: string;
      type: string;
      quantity: number;
    }>;
    achievements: string[];
  };
  gameState: {
    currentChapter: number;
    currentScene: string;
    currentDay: number;
    timeOfDay: string;
    location: string;
    weather: string;
    season: string;
    flags: Record<string, boolean>;
    variables: Record<string, any>;
  };
  progress: {
    storyProgress: number;        // 0-100
    unlockedFeatures: string[];
    completedQuests: string[];
    achievements: Array<{
      id: string;
      name: string;
      description: string;
      unlockedAt: number;
    }>;
  };
  metadata: {
    version: string;
    playTime: number;            // seconds
    lastPlayed: number;          // timestamp
    platform: string;
    saveSlot: number;
    autoSave: boolean;
  };
}

export interface SaveResponse {
  success: boolean;
  saveId: string;
  timestamp: number;
  version: string;
  checksum: string;
  backupCreated: boolean;
  error?: string;
}

export interface LoadResponse {
  success: boolean;
  data?: SaveRequest;
  saveInfo: {
    id: string;
    slot: number;
    timestamp: number;
    version: string;
    playTime: number;
    preview: {
      companionName: string;
      playerLevel: number;
      currentChapter: number;
      lastScene: string;
    };
  };
  backups?: Array<{
    id: string;
    timestamp: number;
    version: string;
    reason: 'auto' | 'manual' | 'chapter' | 'emergency';
  }>;
  error?: string;
}

export interface SavesListResponse {
  saves: Array<{
    id: string;
    slot: number;
    timestamp: number;
    version: string;
    playTime: number;
    preview: {
      companionName: string;
      companionLevel: number;
      playerLevel: number;
      currentChapter: number;
      currentScene: string;
      lastPlayed: string;
    };
    size: number;
    isCorrupted: boolean;
  }>;
  totalSlots: number;
  usedSlots: number;
  autoSaveEnabled: boolean;
}

export interface GameStatsResponse {
  player: {
    totalPlayTime: number;
    sessionsPlayed: number;
    averageSessionLength: number;
    firstPlayDate: string;
    lastPlayDate: string;
  };
  companion: {
    relationshipLevel: number;
    intimacyLevel: number;
    conversationsCount: number;
    favoriteTopic: string;
    moodHistory: Array<{
      emotion: string;
      timestamp: number;
      duration: number;
    }>;
  };
  achievements: {
    total: number;
    unlocked: number;
    recent: Array<{
      id: string;
      name: string;
      unlockedAt: number;
    }>;
  };
  gameplay: {
    chaptersCompleted: number;
    questsCompleted: number;
    itemsCollected: number;
    battlesWon: number;
    choicesMade: number;
  };
}