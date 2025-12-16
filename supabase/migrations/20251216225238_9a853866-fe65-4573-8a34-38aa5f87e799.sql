-- Add referral_code column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Create referrals tracking table
CREATE TABLE public.referrals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reward_claimed boolean DEFAULT false,
  coupon_code text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  UNIQUE(referred_id)
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referrals
CREATE POLICY "Users can view their referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "System can insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their referrals" ON public.referrals
  FOR UPDATE USING (auth.uid() = referrer_id);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substring(md5(random()::text || NEW.user_id::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to auto-generate referral code on profile creation
CREATE TRIGGER generate_referral_code_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_referral_code();

-- Update existing profiles with referral codes
UPDATE public.profiles 
SET referral_code = upper(substring(md5(random()::text || user_id::text) from 1 for 8))
WHERE referral_code IS NULL;