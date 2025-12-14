-- Add RLS policy to allow public reading of user_streaks for leaderboard (limited data)
CREATE POLICY "Anyone can view leaderboard data"
ON public.user_streaks
FOR SELECT
USING (true);

-- Add RLS policy to allow public reading of profiles for leaderboard display
CREATE POLICY "Anyone can view profiles for leaderboard"
ON public.profiles
FOR SELECT
USING (true);