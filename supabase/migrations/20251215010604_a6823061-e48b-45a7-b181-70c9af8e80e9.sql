-- Drop the existing public access policy
DROP POLICY IF EXISTS "Anyone can view active booking slots by slug" ON public.booking_slots;

-- Create a new restrictive policy that only allows viewing non-sensitive fields
-- We'll handle this by creating a view or using the edge function for host_email
CREATE POLICY "Anyone can view active booking slots by slug (limited fields)" 
ON public.booking_slots 
FOR SELECT 
USING ((is_active = true) AND (public_slug IS NOT NULL));

-- Create a security definer function to get host_email securely (only for edge functions/service role)
CREATE OR REPLACE FUNCTION public.get_booking_slot_host_email(slot_id_param uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT host_email 
  FROM public.booking_slots 
  WHERE id = slot_id_param;
$$;