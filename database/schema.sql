-- Soulmate AI Companion Game Database Schema
-- Supabase PostgreSQL Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User profiles table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
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
CREATE TABLE public.companions (
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
CREATE TABLE public.game_states (
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
CREATE TABLE public.messages (
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

-- Memory bank for AI companions
CREATE TABLE public.companion_memories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  companion_id UUID REFERENCES public.companions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Memory content
  content TEXT NOT NULL,
  memory_type VARCHAR(20) NOT NULL CHECK (memory_type IN ('short_term', 'long_term', 'preference', 'key_moment')),
  emotion VARCHAR(20),
  importance REAL DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  
  -- Categorization
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  related_event VARCHAR(50),
  
  -- Access patterns
  access_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE -- For short-term memories
);

-- Special moments and achievements
CREATE TABLE public.special_moments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  companion_id UUID REFERENCES public.companions(id) ON DELETE CASCADE NOT NULL,
  
  -- Moment details
  moment_type VARCHAR(30) NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'legendary')),
  
  -- Associated data
  trigger_data JSONB,
  screenshot_url TEXT,
  
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences and settings
CREATE TABLE public.user_settings (
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

-- AI conversation context and analytics
CREATE TABLE public.conversation_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
  companion_id UUID REFERENCES public.companions(id) ON DELETE CASCADE NOT NULL,
  
  -- Session metadata
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  
  -- Context tracking
  topics_discussed TEXT[] DEFAULT ARRAY[]::TEXT[],
  emotions_detected TEXT[] DEFAULT ARRAY[]::TEXT[],
  activities_performed TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Quality metrics
  user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
  ai_response_quality REAL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game analytics and metrics
CREATE TABLE public.analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Event details
  event_type VARCHAR(50) NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  properties JSONB DEFAULT '{}',
  
  -- Context
  session_id UUID,
  page_url TEXT,
  user_agent TEXT,
  
  -- Anonymization
  ip_hash VARCHAR(64), -- Hashed IP for privacy
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_companions_user_id ON public.companions(user_id);
CREATE INDEX idx_game_states_user_id ON public.game_states(user_id);
CREATE INDEX idx_messages_user_companion ON public.messages(user_id, companion_id);
CREATE INDEX idx_messages_session ON public.messages(conversation_session_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_memories_companion_type ON public.companion_memories(companion_id, memory_type);
CREATE INDEX idx_memories_importance ON public.companion_memories(importance DESC);
CREATE INDEX idx_special_moments_user ON public.special_moments(user_id, unlocked_at DESC);
CREATE INDEX idx_conversation_sessions_user ON public.conversation_sessions(user_id, session_start DESC);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type, created_at DESC);

-- Row Level Security (RLS) policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.special_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their own data
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own companions" ON public.companions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own game state" ON public.game_states
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own messages" ON public.messages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own memories" ON public.companion_memories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own special moments" ON public.special_moments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own conversation sessions" ON public.conversation_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Analytics can be inserted by anyone (for anonymous analytics)
CREATE POLICY "Allow analytics insertion" ON public.analytics_events
  FOR INSERT WITH CHECK (true);

-- Analytics can only be read by authenticated users viewing their own data
CREATE POLICY "Users can view own analytics" ON public.analytics_events
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Functions and triggers
-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companions_updated_at BEFORE UPDATE ON public.companions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_states_updated_at BEFORE UPDATE ON public.game_states
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', new.email),
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  
  -- Create default settings
  INSERT INTO public.user_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to cleanup old short-term memories
CREATE OR REPLACE FUNCTION cleanup_expired_memories()
RETURNS void AS $$
BEGIN
  DELETE FROM public.companion_memories 
  WHERE memory_type = 'short_term' 
    AND expires_at < NOW();
END;
$$ language plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.user_profiles IS 'Extended user profiles with game-specific data';
COMMENT ON TABLE public.companions IS 'AI companions with personality traits and relationship data';
COMMENT ON TABLE public.game_states IS 'Player game progress and current state';
COMMENT ON TABLE public.messages IS 'Chat messages between users and AI companions';
COMMENT ON TABLE public.companion_memories IS 'AI companion memory bank for context and personalization';
COMMENT ON TABLE public.special_moments IS 'Special events and achievements in the game';
COMMENT ON TABLE public.user_settings IS 'User preferences and game settings';
COMMENT ON TABLE public.conversation_sessions IS 'Analytics and context for conversation sessions';
COMMENT ON TABLE public.analytics_events IS 'Game analytics and user behavior tracking';