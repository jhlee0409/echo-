-- Migration: 002_indexes_and_rls
-- Description: Create indexes and Row Level Security policies
-- Created: 2025-01-28
-- Depends on: 001_initial_schema

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_companions_user_id ON public.companions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_states_user_id ON public.game_states(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_companion ON public.messages(user_id, companion_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON public.messages(conversation_session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
  DROP POLICY IF EXISTS "Users can manage own companions" ON public.companions;
  DROP POLICY IF EXISTS "Users can manage own game state" ON public.game_states;
  DROP POLICY IF EXISTS "Users can manage own messages" ON public.messages;
  DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;

  -- Create new policies
  CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR ALL USING (auth.uid() = id);

  CREATE POLICY "Users can manage own companions" ON public.companions
    FOR ALL USING (auth.uid() = user_id);

  CREATE POLICY "Users can manage own game state" ON public.game_states
    FOR ALL USING (auth.uid() = user_id);

  CREATE POLICY "Users can manage own messages" ON public.messages
    FOR ALL USING (auth.uid() = user_id);

  CREATE POLICY "Users can manage own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);
END
$$;