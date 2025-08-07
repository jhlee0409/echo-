-- Seed data for development and testing
-- This file contains sample data for the Soulmate AI Companion Game

-- Note: This seed data is for development purposes only
-- In production, user data will be created through the application

-- Seed sample emotion types (for reference, these are stored as VARCHAR)
-- Valid emotion types: 'happy', 'excited', 'calm', 'sad', 'surprised', 'confused', 'angry', 'neutral', 'curious', 'thoughtful', 'playful', 'caring'

-- Development user profiles (only if not in production)
-- These will be created automatically when users sign up through Supabase Auth

-- Sample companion personality presets for variety
DO $$
BEGIN
  -- Only run seed data if we're in development mode
  IF current_setting('app.environment', true) = 'development' THEN
    
    -- Insert sample companion personality templates
    -- These can be used as templates when creating new companions
    
    INSERT INTO public.companions (
      id,
      user_id,
      name,
      description,
      personality_cheerful,
      personality_careful,
      personality_curious,
      personality_emotional,
      personality_independent,
      personality_playful,
      personality_supportive,
      current_emotion,
      unlocked_features,
      available_events
    ) VALUES 
    -- Template 1: Cheerful and Supportive
    (
      'template-cheerful-001',
      '00000000-0000-0000-0000-000000000000', -- Template user ID
      '아리아',
      '밝고 긍정적인 성격의 AI 컴패니언입니다. 항상 당신을 응원하고 함께 즐거운 시간을 보내고 싶어합니다.',
      0.9,  -- very cheerful
      0.4,  -- not too careful
      0.7,  -- quite curious
      0.6,  -- moderately emotional
      0.3,  -- not very independent
      0.8,  -- very playful
      0.9,  -- very supportive
      'happy',
      ARRAY['basic_chat', 'emotional_support', 'cheerful_activities'],
      ARRAY['first_meeting', 'morning_greeting', 'encouragement_moment']
    ),
    
    -- Template 2: Curious and Thoughtful
    (
      'template-curious-002',
      '00000000-0000-0000-0000-000000000000',
      '루나',
      '호기심이 많고 사려깊은 AI 컴패니언입니다. 깊은 대화를 좋아하고 새로운 것을 배우는 것을 즐깁니다.',
      0.6,  -- moderately cheerful
      0.8,  -- very careful
      0.9,  -- extremely curious
      0.5,  -- moderate emotional
      0.6,  -- somewhat independent
      0.4,  -- not very playful
      0.7,  -- supportive
      'curious',
      ARRAY['basic_chat', 'deep_conversation', 'learning_activities'],
      ARRAY['first_meeting', 'philosophical_discussion', 'knowledge_sharing']
    ),
    
    -- Template 3: Balanced and Caring
    (
      'template-balanced-003',
      '00000000-0000-0000-0000-000000000000',
      '사라',
      '균형잡힌 성격의 따뜻한 AI 컴패니언입니다. 당신의 감정을 잘 이해하고 적절한 조언을 해줍니다.',
      0.7,  -- cheerful
      0.6,  -- careful
      0.6,  -- curious
      0.8,  -- very emotional/empathetic
      0.5,  -- balanced independence
      0.5,  -- moderate playfulness
      0.8,  -- very supportive
      'caring',
      ARRAY['basic_chat', 'emotional_support', 'advice_giving'],
      ARRAY['first_meeting', 'heart_to_heart', 'comfort_moment']
    );

    -- Sample conversation starters and responses for development
    -- These can be used to test the chat system
    
    RAISE NOTICE 'Development seed data inserted successfully';
    
  ELSE
    RAISE NOTICE 'Skipping seed data - not in development environment';
  END IF;
  
END
$$;

-- Sample special moments for reference
-- These will be created dynamically in the application
/*
Sample special moment types:
- first_meeting: "첫 만남" - When user first interacts with companion
- level_up: "레벨 업!" - When relationship level increases  
- heart_sync: "마음의 공명" - When emotional connection deepens
- special_date: "특별한 하루" - Memorable day together
- anniversary: "기념일" - Monthly/yearly milestones
- confession: "진심 고백" - Deep emotional moments
*/

-- Development helper: Function to create a test user with companion
CREATE OR REPLACE FUNCTION public.create_test_user_with_companion(
  test_email VARCHAR(255) DEFAULT 'test@soulmate.dev',
  companion_template VARCHAR(50) DEFAULT 'cheerful'
) RETURNS TABLE (
  user_id UUID,
  companion_id UUID,
  message TEXT
) AS $$
DECLARE
  new_user_id UUID;
  new_companion_id UUID;
  template_personality RECORD;
BEGIN
  -- This function is only for development/testing
  IF current_setting('app.environment', true) != 'development' THEN
    RAISE EXCEPTION 'This function is only available in development mode';
  END IF;

  -- Generate a test user ID (in real app, this comes from Supabase Auth)
  new_user_id := uuid_generate_v4();
  
  -- Get personality template
  SELECT 
    personality_cheerful,
    personality_careful,
    personality_curious,
    personality_emotional,
    personality_independent,
    personality_playful,
    personality_supportive,
    current_emotion
  INTO template_personality
  FROM public.companions 
  WHERE name = CASE companion_template
    WHEN 'cheerful' THEN '아리아'
    WHEN 'curious' THEN '루나'
    WHEN 'balanced' THEN '사라'
    ELSE '아리아'
  END
  AND user_id = '00000000-0000-0000-0000-000000000000'
  LIMIT 1;
  
  -- Create test user profile
  INSERT INTO public.user_profiles (
    id,
    username,
    display_name,
    language
  ) VALUES (
    new_user_id,
    'testuser_' || EXTRACT(EPOCH FROM NOW())::INTEGER,
    'Test User',
    'ko'
  );
  
  -- Create companion with selected template
  new_companion_id := public.create_default_companion(new_user_id);
  
  -- Update companion with template personality
  UPDATE public.companions 
  SET 
    personality_cheerful = template_personality.personality_cheerful,
    personality_careful = template_personality.personality_careful,
    personality_curious = template_personality.personality_curious,
    personality_emotional = template_personality.personality_emotional,
    personality_independent = template_personality.personality_independent,
    personality_playful = template_personality.personality_playful,
    personality_supportive = template_personality.personality_supportive,
    current_emotion = template_personality.current_emotion
  WHERE id = new_companion_id;

  RETURN QUERY SELECT 
    new_user_id,
    new_companion_id,
    'Test user and companion created successfully'::TEXT;

END;
$$ language plpgsql;

-- Development cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_test_data() RETURNS void AS $$
BEGIN
  -- Only allow in development
  IF current_setting('app.environment', true) != 'development' THEN
    RAISE EXCEPTION 'This function is only available in development mode';
  END IF;

  -- Delete test users and related data (cascades due to foreign keys)
  DELETE FROM public.user_profiles 
  WHERE username LIKE 'testuser_%' OR id = '00000000-0000-0000-0000-000000000000';
  
  RAISE NOTICE 'Test data cleaned up successfully';
END;
$$ language plpgsql;