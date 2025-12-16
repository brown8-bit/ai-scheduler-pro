-- Create waitlist table for upcoming features
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  feature TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(email, feature)
);

-- Enable Row Level Security
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can sign up for the waitlist
CREATE POLICY "Anyone can join waitlist" 
ON public.waitlist 
FOR INSERT 
WITH CHECK (true);

-- Users can view their own waitlist entries (by email match would require auth, so admins only for now)
CREATE POLICY "Admins can view waitlist" 
ON public.waitlist 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage waitlist
CREATE POLICY "Admins can manage waitlist" 
ON public.waitlist 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));