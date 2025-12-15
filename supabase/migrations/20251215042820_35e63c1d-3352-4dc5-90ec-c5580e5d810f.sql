-- Create user usage tracking table
CREATE TABLE public.user_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM' for monthly tracking
  ai_requests_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own usage"
ON public.user_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own usage record
CREATE POLICY "Users can insert their own usage"
ON public.user_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own usage
CREATE POLICY "Users can update their own usage"
ON public.user_usage
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_usage_updated_at
BEFORE UPDATE ON public.user_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to increment AI usage and check limits
CREATE OR REPLACE FUNCTION public.increment_ai_usage(p_user_id UUID, p_limit INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_year TEXT;
  v_current_count INTEGER;
  v_result JSONB;
BEGIN
  v_month_year := to_char(now(), 'YYYY-MM');
  
  -- Insert or update usage record
  INSERT INTO public.user_usage (user_id, month_year, ai_requests_count)
  VALUES (p_user_id, v_month_year, 1)
  ON CONFLICT (user_id, month_year)
  DO UPDATE SET 
    ai_requests_count = user_usage.ai_requests_count + 1,
    updated_at = now()
  RETURNING ai_requests_count INTO v_current_count;
  
  -- Check if over limit (0 means unlimited)
  IF p_limit > 0 AND v_current_count > p_limit THEN
    -- Rollback the increment
    UPDATE public.user_usage 
    SET ai_requests_count = ai_requests_count - 1
    WHERE user_id = p_user_id AND month_year = v_month_year;
    
    RETURN jsonb_build_object(
      'allowed', false,
      'current_count', v_current_count - 1,
      'limit', p_limit,
      'message', 'AI request limit reached for this month'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'current_count', v_current_count,
    'limit', p_limit
  );
END;
$$;

-- Create function to get current usage
CREATE OR REPLACE FUNCTION public.get_user_usage(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_year TEXT;
  v_ai_count INTEGER;
  v_template_count INTEGER;
BEGIN
  v_month_year := to_char(now(), 'YYYY-MM');
  
  -- Get AI request count for current month
  SELECT COALESCE(ai_requests_count, 0) INTO v_ai_count
  FROM public.user_usage
  WHERE user_id = p_user_id AND month_year = v_month_year;
  
  IF v_ai_count IS NULL THEN
    v_ai_count := 0;
  END IF;
  
  -- Get total template count
  SELECT COUNT(*) INTO v_template_count
  FROM public.event_templates
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'ai_requests_this_month', v_ai_count,
    'templates_count', v_template_count,
    'month_year', v_month_year
  );
END;
$$;