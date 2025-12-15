-- Fix: Remove the overly permissive profiles policy
-- The leaderboard now uses the secure get_leaderboard_data() RPC function
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Users can still view their own profiles
-- The "Users can view their own profile" policy already exists with (auth.uid() = user_id)

-- Add DELETE policies for GDPR compliance
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own streaks"
ON public.user_streaks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);