-- Add daily_habits_enabled column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_habits_enabled boolean DEFAULT true;