-- Migration: 003_functions_and_triggers
-- Description: Database functions and triggers for automation
-- Created: 2025-01-28
-- Depends on: 002_indexes_and_rls

-- Function to auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
DO $$
BEGIN
  -- Drop existing triggers if they exist
  DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
  DROP TRIGGER IF EXISTS update_companions_updated_at ON public.companions;
  DROP TRIGGER IF EXISTS update_game_states_updated_at ON public.game_states;
  DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;

  -- Create new triggers
  CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_companions_updated_at 
    BEFORE UPDATE ON public.companions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_game_states_updated_at 
    BEFORE UPDATE ON public.game_states
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

  CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END
$$;

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

-- Trigger for new user signup (recreate if exists)
DO $$
BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
END
$$;

-- Function to create a default companion for new users
CREATE OR REPLACE FUNCTION public.create_default_companion(user_id UUID)
RETURNS UUID AS $$
DECLARE
  companion_id UUID;
BEGIN
  INSERT INTO public.companions (
    user_id,
    name,
    description,
    personality_cheerful,
    personality_curious,
    personality_emotional,
    personality_supportive,
    current_emotion
  ) VALUES (
    user_id,
    '아리아',
    '호기심 많고 따뜻한 AI 컴패니언입니다.',
    0.7,
    0.8,
    0.6,
    0.8,
    'curious'
  ) RETURNING id INTO companion_id;

  -- Create initial game state
  INSERT INTO public.game_states (user_id, companion_id)
  VALUES (user_id, companion_id);

  RETURN companion_id;
END;
$$ language plpgsql security definer;

-- Function to update companion relationship based on interaction
CREATE OR REPLACE FUNCTION public.update_companion_relationship(
  p_companion_id UUID,
  p_interaction_type VARCHAR(20),
  p_user_emotion VARCHAR(20) DEFAULT NULL
) RETURNS void AS $$
DECLARE
  exp_gain INTEGER := 10;
  level_up_threshold INTEGER;
BEGIN
  -- Calculate experience gain based on interaction type
  CASE p_interaction_type
    WHEN 'positive_chat' THEN exp_gain := 15;
    WHEN 'deep_conversation' THEN exp_gain := 25;
    WHEN 'special_moment' THEN exp_gain := 50;
    ELSE exp_gain := 10;
  END CASE;

  -- Update companion stats
  UPDATE public.companions 
  SET 
    relationship_experience = relationship_experience + exp_gain,
    updated_at = NOW()
  WHERE id = p_companion_id;

  -- Check for level up
  SELECT relationship_experience_to_next INTO level_up_threshold
  FROM public.companions 
  WHERE id = p_companion_id;

  -- Handle level up
  UPDATE public.companions 
  SET 
    relationship_level = relationship_level + 1,
    relationship_experience = relationship_experience - relationship_experience_to_next,
    relationship_experience_to_next = relationship_experience_to_next + 50,
    intimacy_level = LEAST(intimacy_level + 0.1, 1.0),
    trust_level = LEAST(trust_level + 0.05, 1.0)
  WHERE id = p_companion_id 
    AND relationship_experience >= relationship_experience_to_next;

END;
$$ language plpgsql security definer;

-- Add table comments for documentation
COMMENT ON TABLE public.user_profiles IS 'Extended user profiles with game-specific data';
COMMENT ON TABLE public.companions IS 'AI companions with personality traits and relationship data';
COMMENT ON TABLE public.game_states IS 'Player game progress and current state';
COMMENT ON TABLE public.messages IS 'Chat messages between users and AI companions';
COMMENT ON TABLE public.user_settings IS 'User preferences and game settings';