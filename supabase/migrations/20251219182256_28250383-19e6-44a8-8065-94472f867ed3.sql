-- Set gamification_enabled to default to false for new users
ALTER TABLE public.profiles 
ALTER COLUMN gamification_enabled SET DEFAULT false;