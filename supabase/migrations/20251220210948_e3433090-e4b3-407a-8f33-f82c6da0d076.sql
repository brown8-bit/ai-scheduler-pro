-- Create demo analytics table for tracking guest demo usage
CREATE TABLE public.demo_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'demo_reset', 'demo_signup_conversion'
  session_id TEXT NOT NULL, -- anonymous session identifier
  prompts_used INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS but allow public inserts for anonymous tracking
ALTER TABLE public.demo_analytics ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert analytics events (anonymous tracking)
CREATE POLICY "Anyone can insert demo analytics"
ON public.demo_analytics
FOR INSERT
WITH CHECK (true);

-- Only authenticated users with admin role can view analytics
CREATE POLICY "Admins can view demo analytics"
ON public.demo_analytics
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for efficient querying
CREATE INDEX idx_demo_analytics_event_type ON public.demo_analytics(event_type);
CREATE INDEX idx_demo_analytics_created_at ON public.demo_analytics(created_at DESC);