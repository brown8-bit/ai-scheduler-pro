-- Fix: Create a secure function to get public booking slot info without exposing user_id
CREATE OR REPLACE FUNCTION public.get_public_booking_slot(slug_param text)
RETURNS TABLE(
  id uuid,
  title text,
  duration_minutes integer,
  available_days integer[],
  start_hour integer,
  end_hour integer,
  is_active boolean,
  public_slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    bs.id,
    bs.title,
    bs.duration_minutes,
    bs.available_days,
    bs.start_hour,
    bs.end_hour,
    bs.is_active,
    bs.public_slug
  FROM public.booking_slots bs
  WHERE bs.public_slug = slug_param
    AND bs.is_active = true;
$$;

-- Drop the public SELECT policy that exposes user_id
DROP POLICY IF EXISTS "Anyone can view active booking slots by slug (limited fields)" ON public.booking_slots;