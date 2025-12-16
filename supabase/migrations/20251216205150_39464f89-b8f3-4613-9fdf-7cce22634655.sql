-- Create a function to check if a display name is available
CREATE OR REPLACE FUNCTION public.is_display_name_available(p_display_name text, p_current_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE LOWER(display_name) = LOWER(p_display_name)
      AND (p_current_user_id IS NULL OR user_id != p_current_user_id)
  );
$$;