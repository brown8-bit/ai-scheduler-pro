-- Add last_seen_at column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN last_seen_at timestamp with time zone DEFAULT now();

-- Create an index for efficient querying
CREATE INDEX idx_profiles_last_seen_at ON public.profiles(last_seen_at DESC);