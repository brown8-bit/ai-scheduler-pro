-- Fix: Require authentication for viewing leaderboard data
-- Drop the overly permissive policy on user_streaks
DROP POLICY IF EXISTS "Anyone can view leaderboard data" ON public.user_streaks;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can view leaderboard data"
ON public.user_streaks
FOR SELECT
TO authenticated
USING (true);

-- Fix: Require authentication for viewing profiles for leaderboard
-- Drop the overly permissive policy on profiles  
DROP POLICY IF EXISTS "Authenticated users can view profiles for leaderboard" ON public.profiles;

-- Create a new policy that properly requires authentication
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Fix: Allow hosts to delete their own bookings
CREATE POLICY "Users can delete their bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (auth.uid() = host_user_id);