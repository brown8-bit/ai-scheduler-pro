-- Add host_email column to booking_slots table
ALTER TABLE public.booking_slots 
ADD COLUMN host_email text;

-- Update RLS to allow reading host_email for active public slots
DROP POLICY IF EXISTS "Anyone can view active booking slots by slug" ON public.booking_slots;
CREATE POLICY "Anyone can view active booking slots by slug" 
ON public.booking_slots 
FOR SELECT 
USING ((is_active = true) AND (public_slug IS NOT NULL));