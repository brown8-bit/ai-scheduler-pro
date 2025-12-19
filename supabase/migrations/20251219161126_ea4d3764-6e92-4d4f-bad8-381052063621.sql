-- Update default for gamification_enabled to false
ALTER TABLE public.profiles 
ALTER COLUMN gamification_enabled SET DEFAULT false;