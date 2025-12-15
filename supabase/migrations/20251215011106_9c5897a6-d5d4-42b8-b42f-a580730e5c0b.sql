-- Drop the public access policy that exposes all user data
DROP POLICY IF EXISTS "Anyone can view profiles for leaderboard" ON public.profiles;

-- Create a policy that only allows authenticated users to view profiles
CREATE POLICY "Authenticated users can view profiles for leaderboard" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Create a secure leaderboard function that returns only necessary anonymized data
CREATE OR REPLACE FUNCTION public.get_leaderboard_data(limit_count integer DEFAULT 10)
RETURNS TABLE (
  rank_position integer,
  display_name text,
  avatar_url text,
  current_streak integer,
  total_events_completed integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ROW_NUMBER() OVER (ORDER BY us.total_events_completed DESC)::integer as rank_position,
    COALESCE(p.display_name, 'Anonymous User') as display_name,
    p.avatar_url,
    COALESCE(us.current_streak, 0) as current_streak,
    COALESCE(us.total_events_completed, 0) as total_events_completed
  FROM public.user_streaks us
  LEFT JOIN public.profiles p ON p.user_id = us.user_id
  ORDER BY us.total_events_completed DESC
  LIMIT limit_count;
$$;