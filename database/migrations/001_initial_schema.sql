-- Migration: 001_initial_schema
-- Description: Initial database schema for Soulmate AI Companion Game
-- Created: 2025-01-28

-- This migration creates the complete initial schema
-- Run this in Supabase SQL Editor or via CLI migration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  language VARCHAR(2) DEFAULT 'ko',
  timezone VARCHAR(50) DEFAULT 'Asia/Seoul',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Privacy settings
  is_public BOOLEAN DEFAULT true,
  allow_analytics BOOLEAN DEFAULT true
);

-- AI Companions table
CREATE TABLE IF NOT EXISTS public.companions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(50) NOT NULL,
  avatar_url TEXT,
  description TEXT,
  
  -- Personality traits (0.0 - 1.0)
  personality_cheerful REAL DEFAULT 0.5 CHECK (personality_cheerful >= 0 AND personality_cheerful <= 1),
  personality_careful REAL DEFAULT 0.5 CHECK (personality_careful >= 0 AND personality_careful <= 1),
  personality_curious REAL DEFAULT 0.5 CHECK (personality_curious >= 0 AND personality_curious <= 1),
  personality_emotional REAL DEFAULT 0.5 CHECK (personality_emotional >= 0 AND personality_emotional <= 1),
  personality_independent REAL DEFAULT 0.5 CHECK (personality_independent >= 0 AND personality_independent <= 1),
  personality_playful REAL DEFAULT 0.5 CHECK (personality_playful >= 0 AND personality_playful <= 1),
  personality_supportive REAL DEFAULT 0.5 CHECK (personality_supportive >= 0 AND personality_supportive <= 1),
  
  -- Relationship status
  relationship_level INTEGER DEFAULT 1 CHECK (relationship_level >= 1 AND relationship_level <= 10),
  relationship_experience INTEGER DEFAULT 0 CHECK (relationship_experience >= 0),
  relationship_experience_to_next INTEGER DEFAULT 100,
  intimacy_level REAL DEFAULT 0.1 CHECK (intimacy_level >= 0 AND intimacy_level <= 1),
  trust_level REAL DEFAULT 0.1 CHECK (trust_level >= 0 AND trust_level <= 1),
  
  -- Current emotional state
  current_emotion VARCHAR(20) DEFAULT 'neutral',
  emotion_intensity REAL DEFAULT 0.5 CHECK (emotion_intensity >= 0 AND emotion_intensity <= 1),
  emotion_stability REAL DEFAULT 0.8 CHECK (emotion_stability >= 0 AND emotion_stability <= 1),
  
  -- Game progress
  unlocked_features TEXT[] DEFAULT ARRAY['basic_chat'],
  completed_events TEXT[] DEFAULT ARRAY[]::TEXT[],
  available_events TEXT[] DEFAULT ARRAY['first_meeting'],
  relationship_milestones TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game states table
CREATE TABLE IF NOT EXISTS public.game_states (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  companion_id UUID REFERENCES public.companions(id) ON DELETE CASCADE,
  
  -- Game progress
  level INTEGER DEFAULT 1 CHECK (level >= 1),
  experience INTEGER DEFAULT 0 CHECK (experience >= 0),
  conversation_count INTEGER DEFAULT 0 CHECK (conversation_count >= 0),
  days_since_start INTEGER DEFAULT 0 CHECK (days_since_start >= 0),
  play_time INTEGER DEFAULT 0 CHECK (play_time >= 0), -- in seconds
  
  -- Current state
  current_scene VARCHAR(50) DEFAULT 'main_room',
  unlocked_features TEXT[] DEFAULT ARRAY['chat', 'status'],
  
  -- Timestamps
  last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_saved TIMESTAMP WITH TIME ZONE,
  is_first_time BOOLEAN DEFAULT true,
  game_version VARCHAR(20) DEFAULT '1.0.0-alpha',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one game state per user
  CONSTRAINT unique_game_state_per_user UNIQUE (user_id)
);

-- Conversation messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  companion_id UUID REFERENCES public.companions(id) ON DELETE CASCADE NOT NULL,
  conversation_session_id UUID NOT NULL, -- Group related messages
  
  -- Message content
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
  content TEXT NOT NULL,
  emotion VARCHAR(20),
  
  -- Metadata
  tokens_used INTEGER DEFAULT 0,
  ai_provider VARCHAR(50),
  processing_time INTEGER, -- milliseconds
  is_cached BOOLEAN DEFAULT false,
  
  -- Context
  context_data JSONB, -- Store additional context like current activity, mood, etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Audio settings
  sound_enabled BOOLEAN DEFAULT true,
  music_enabled BOOLEAN DEFAULT true,
  animations_enabled BOOLEAN DEFAULT true,
  
  -- Display settings
  dark_mode BOOLEAN DEFAULT true,
  language VARCHAR(2) DEFAULT 'ko',
  notifications BOOLEAN DEFAULT true,
  auto_save BOOLEAN DEFAULT true,
  debug_mode BOOLEAN DEFAULT false,
  
  -- Privacy settings
  allow_analytics BOOLEAN DEFAULT true,
  allow_ai_learning BOOLEAN DEFAULT true,
  
  -- Communication preferences
  communication_style VARCHAR(20) DEFAULT 'friendly',
  preferred_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
  content_filters JSONB DEFAULT '{}',
  custom_instructions TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);