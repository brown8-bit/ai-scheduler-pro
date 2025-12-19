-- Add gamification_enabled column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gamification_enabled boolean DEFAULT true;