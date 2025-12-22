-- Create table to track terms acceptance for compliance
CREATE TABLE public.terms_acceptances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  terms_version TEXT NOT NULL DEFAULT '1.0',
  privacy_version TEXT NOT NULL DEFAULT '1.0',
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups by user
CREATE INDEX idx_terms_acceptances_user_id ON public.terms_acceptances(user_id);

-- Enable RLS
ALTER TABLE public.terms_acceptances ENABLE ROW LEVEL SECURITY;

-- Users can view their own acceptances
CREATE POLICY "Users can view their own terms acceptances"
ON public.terms_acceptances
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own acceptance records
CREATE POLICY "Users can record their own terms acceptance"
ON public.terms_acceptances
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow anonymous insert during registration (before user is authenticated)
CREATE POLICY "Allow anonymous terms acceptance during registration"
ON public.terms_acceptances
FOR INSERT
WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE public.terms_acceptances IS 'Tracks user acceptance of Terms of Service and Privacy Policy for compliance';