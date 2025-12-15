-- Fix: Remove the overly permissive leaderboard policy on user_streaks
-- The leaderboard now uses the secure get_leaderboard_data() RPC function
DROP POLICY IF EXISTS "Authenticated users can view leaderboard data" ON public.user_streaks;

-- Users can still view their own streaks for the personal stats display
-- The "Users can view their own streaks" policy already exists with (auth.uid() = user_id)