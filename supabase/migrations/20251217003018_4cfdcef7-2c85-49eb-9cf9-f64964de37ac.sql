-- Drop existing lifetime-only RLS policies
DROP POLICY IF EXISTS "Lifetime members can view all posts" ON public.social_posts;
DROP POLICY IF EXISTS "Lifetime members can view comments" ON public.post_comments;
DROP POLICY IF EXISTS "Lifetime members can view likes" ON public.post_likes;
DROP POLICY IF EXISTS "Lifetime members can view reposts" ON public.post_reposts;

-- Create new policies allowing all authenticated users to view
CREATE POLICY "Authenticated users can view all posts" 
ON public.social_posts 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view comments" 
ON public.post_comments 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view likes" 
ON public.post_likes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view reposts" 
ON public.post_reposts 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update profiles table to allow authenticated users to view other profiles (for community)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);