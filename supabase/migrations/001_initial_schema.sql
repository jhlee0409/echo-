-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    language TEXT NOT NULL DEFAULT 'ko',
    timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    allow_analytics BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create companions table
CREATE TABLE IF NOT EXISTS companions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    description TEXT,
    
    -- Personality traits (0.0 to 1.0)
    personality_cheerful DECIMAL(3,2) NOT NULL DEFAULT 0.7,
    personality_careful DECIMAL(3,2) NOT NULL DEFAULT 0.6,
    personality_curious DECIMAL(3,2) NOT NULL DEFAULT 0.8,
    personality_emotional DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    personality_independent DECIMAL(3,2) NOT NULL DEFAULT 0.6,
    personality_playful DECIMAL(3,2) NOT NULL DEFAULT 0.7,
    personality_supportive DECIMAL(3,2) NOT NULL DEFAULT 0.8,
    
    -- Relationship (1-10 levels)
    relationship_level INTEGER NOT NULL DEFAULT 1,
    relationship_experience INTEGER NOT NULL DEFAULT 0,
    relationship_experience_to_next INTEGER NOT NULL DEFAULT 100,
    intimacy_level DECIMAL(3,2) NOT NULL DEFAULT 0.1,
    trust_level DECIMAL(3,2) NOT NULL DEFAULT 0.1,
    
    -- Emotions
    current_emotion TEXT NOT NULL DEFAULT 'neutral',
    emotion_intensity DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    emotion_stability DECIMAL(3,2) NOT NULL DEFAULT 0.7,
    
    -- Progress arrays
    unlocked_features TEXT[] NOT NULL DEFAULT '{}',
    completed_events TEXT[] NOT NULL DEFAULT '{}',
    available_events TEXT[] NOT NULL DEFAULT '{}',
    relationship_milestones TEXT[] NOT NULL DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT personality_cheerful_range CHECK (personality_cheerful >= 0.0 AND personality_cheerful <= 1.0),
    CONSTRAINT personality_careful_range CHECK (personality_careful >= 0.0 AND personality_careful <= 1.0),
    CONSTRAINT personality_curious_range CHECK (personality_curious >= 0.0 AND personality_curious <= 1.0),
    CONSTRAINT personality_emotional_range CHECK (personality_emotional >= 0.0 AND personality_emotional <= 1.0),
    CONSTRAINT personality_independent_range CHECK (personality_independent >= 0.0 AND personality_independent <= 1.0),
    CONSTRAINT personality_playful_range CHECK (personality_playful >= 0.0 AND personality_playful <= 1.0),
    CONSTRAINT personality_supportive_range CHECK (personality_supportive >= 0.0 AND personality_supportive <= 1.0),
    CONSTRAINT relationship_level_range CHECK (relationship_level >= 1 AND relationship_level <= 10),
    CONSTRAINT intimacy_level_range CHECK (intimacy_level >= 0.0 AND intimacy_level <= 1.0),
    CONSTRAINT trust_level_range CHECK (trust_level >= 0.0 AND trust_level <= 1.0),
    CONSTRAINT emotion_intensity_range CHECK (emotion_intensity >= 0.0 AND emotion_intensity <= 1.0),
    CONSTRAINT emotion_stability_range CHECK (emotion_stability >= 0.0 AND emotion_stability <= 1.0)
);

-- Create game_states table
CREATE TABLE IF NOT EXISTS game_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    companion_id UUID REFERENCES companions(id) ON DELETE SET NULL,
    
    -- Game progress
    level INTEGER NOT NULL DEFAULT 1,
    experience INTEGER NOT NULL DEFAULT 0,
    conversation_count INTEGER NOT NULL DEFAULT 0,
    days_since_start INTEGER NOT NULL DEFAULT 0,
    play_time INTEGER NOT NULL DEFAULT 0, -- in minutes
    
    -- Current state
    current_scene TEXT NOT NULL DEFAULT 'welcome',
    unlocked_features TEXT[] NOT NULL DEFAULT '{}',
    last_played TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_saved TIMESTAMP WITH TIME ZONE,
    is_first_time BOOLEAN NOT NULL DEFAULT TRUE,
    game_version TEXT NOT NULL DEFAULT '1.0.0',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Unique constraint to ensure one game state per user
    UNIQUE(user_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    companion_id UUID REFERENCES companions(id) ON DELETE CASCADE,
    conversation_session_id TEXT NOT NULL,
    
    -- Message content
    sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
    content TEXT NOT NULL,
    emotion TEXT,
    
    -- AI metadata
    tokens_used INTEGER DEFAULT 0,
    ai_provider TEXT,
    processing_time INTEGER, -- in milliseconds
    is_cached BOOLEAN NOT NULL DEFAULT FALSE,
    context_data JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- UI preferences
    sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    music_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    animations_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
    language TEXT NOT NULL DEFAULT 'ko',
    
    -- Feature preferences
    notifications BOOLEAN NOT NULL DEFAULT TRUE,
    auto_save BOOLEAN NOT NULL DEFAULT TRUE,
    debug_mode BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Privacy preferences
    allow_analytics BOOLEAN NOT NULL DEFAULT TRUE,
    allow_ai_learning BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Communication preferences
    communication_style TEXT NOT NULL DEFAULT 'balanced',
    preferred_topics TEXT[] NOT NULL DEFAULT '{}',
    content_filters JSONB NOT NULL DEFAULT '{}',
    custom_instructions TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companions_updated_at
    BEFORE UPDATE ON companions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_states_updated_at
    BEFORE UPDATE ON game_states
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to create default companion for new users
CREATE OR REPLACE FUNCTION create_default_companion(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    companion_id UUID;
BEGIN
    INSERT INTO companions (
        user_id,
        name,
        description,
        personality_cheerful,
        personality_careful,
        personality_curious,
        personality_emotional,
        personality_independent,
        personality_playful,
        personality_supportive
    ) VALUES (
        p_user_id,
        'AI 친구',
        '당신만의 특별한 AI 컴패니언입니다.',
        0.7,  -- cheerful
        0.6,  -- careful
        0.8,  -- curious
        0.5,  -- emotional
        0.6,  -- independent
        0.7,  -- playful
        0.8   -- supportive
    ) RETURNING id INTO companion_id;
    
    RETURN companion_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to update companion relationship based on interactions
CREATE OR REPLACE FUNCTION update_companion_relationship(
    p_companion_id UUID,
    p_interaction_type TEXT,
    p_user_emotion TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    experience_gain INTEGER := 5;
    intimacy_gain DECIMAL := 0.01;
    trust_gain DECIMAL := 0.01;
BEGIN
    -- Adjust gains based on interaction type
    CASE p_interaction_type
        WHEN 'positive' THEN
            experience_gain := 10;
            intimacy_gain := 0.02;
            trust_gain := 0.02;
        WHEN 'neutral' THEN
            experience_gain := 5;
            intimacy_gain := 0.01;
            trust_gain := 0.01;
        WHEN 'negative' THEN
            experience_gain := 2;
            intimacy_gain := -0.01;
            trust_gain := -0.01;
        ELSE
            experience_gain := 5;
    END CASE;
    
    -- Update companion relationship
    UPDATE companions
    SET 
        relationship_experience = relationship_experience + experience_gain,
        intimacy_level = LEAST(1.0, GREATEST(0.0, intimacy_level + intimacy_gain)),
        trust_level = LEAST(1.0, GREATEST(0.0, trust_level + trust_gain)),
        updated_at = NOW()
    WHERE id = p_companion_id;
    
    -- Check for level up
    UPDATE companions
    SET 
        relationship_level = relationship_level + 1,
        relationship_experience = relationship_experience - relationship_experience_to_next,
        relationship_experience_to_next = relationship_experience_to_next + 50
    WHERE id = p_companion_id 
      AND relationship_experience >= relationship_experience_to_next
      AND relationship_level < 10;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for companions
CREATE POLICY "Users can view own companions" ON companions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companions" ON companions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companions" ON companions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own companions" ON companions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for game_states
CREATE POLICY "Users can view own game state" ON game_states
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game state" ON game_states
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game state" ON game_states
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companions_user_id ON companions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_states_user_id ON game_states(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_companion_id ON messages(companion_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_companion ON messages(user_id, companion_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(conversation_session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_desc ON messages(created_at DESC);

-- Insert default data for development/testing
INSERT INTO user_profiles (id, username, display_name, language, timezone) 
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'demo_user',
    'Demo User',
    'ko',
    'Asia/Seoul'
) ON CONFLICT (id) DO NOTHING;

-- Create default companion for demo user
DO $$
DECLARE
    demo_companion_id UUID;
BEGIN
    SELECT create_default_companion('00000000-0000-0000-0000-000000000001'::UUID) INTO demo_companion_id;
    
    -- Create default game state
    INSERT INTO game_states (user_id, companion_id)
    VALUES ('00000000-0000-0000-0000-000000000001'::UUID, demo_companion_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create default settings
    INSERT INTO user_settings (user_id)
    VALUES ('00000000-0000-0000-0000-000000000001'::UUID)
    ON CONFLICT (user_id) DO NOTHING;
END $$;