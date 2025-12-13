-- Add recurring event support and public booking
ALTER TABLE public.scheduled_events 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT, -- 'daily', 'weekly', 'monthly'
ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;

-- Create public booking slots table
CREATE TABLE public.booking_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Meeting',
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  available_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- 0=Sun, 1=Mon, etc.
  start_hour INTEGER NOT NULL DEFAULT 9,
  end_hour INTEGER NOT NULL DEFAULT 17,
  is_active BOOLEAN DEFAULT true,
  public_slug TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table for when someone books a slot
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID REFERENCES public.booking_slots(id) ON DELETE CASCADE,
  host_user_id UUID NOT NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Booking slots policies (users manage their own)
CREATE POLICY "Users can view their own booking slots"
ON public.booking_slots FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own booking slots"
ON public.booking_slots FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own booking slots"
ON public.booking_slots FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own booking slots"
ON public.booking_slots FOR DELETE
USING (auth.uid() = user_id);

-- Public can view active booking slots by slug
CREATE POLICY "Anyone can view active booking slots by slug"
ON public.booking_slots FOR SELECT
USING (is_active = true AND public_slug IS NOT NULL);

-- Bookings policies
CREATE POLICY "Users can view bookings for their slots"
ON public.bookings FOR SELECT
USING (auth.uid() = host_user_id);

CREATE POLICY "Anyone can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their bookings"
ON public.bookings FOR UPDATE
USING (auth.uid() = host_user_id);