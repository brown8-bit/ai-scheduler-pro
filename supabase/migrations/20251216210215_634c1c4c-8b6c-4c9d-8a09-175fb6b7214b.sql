-- Create reposts table for repost/quote functionality
CREATE TABLE public.post_reposts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  quote_text TEXT,
  is_quote BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Lifetime members can view reposts"
ON public.post_reposts
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.is_lifetime = true
));

CREATE POLICY "Users can create reposts"
ON public.post_reposts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reposts"
ON public.post_reposts
FOR DELETE
USING (auth.uid() = user_id);

-- Add unique constraint to prevent duplicate reposts (not quotes)
CREATE UNIQUE INDEX unique_repost_per_user 
ON public.post_reposts (user_id, original_post_id) 
WHERE is_quote = false;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reposts;