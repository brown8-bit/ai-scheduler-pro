-- Create calendar_connections table for storing OAuth tokens and sync status
CREATE TABLE public.calendar_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'outlook', 'apple'
  provider_account_id TEXT,
  provider_email TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  calendar_ids TEXT[] DEFAULT '{}',
  sync_enabled BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'synced', 'error'
  sync_error TEXT,
  settings JSONB DEFAULT '{"working_hours_start": 9, "working_hours_end": 17, "buffer_minutes": 15, "no_meeting_days": []}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Enable RLS
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own calendar connections"
ON public.calendar_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar connections"
ON public.calendar_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar connections"
ON public.calendar_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar connections"
ON public.calendar_connections FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_calendar_connections_updated_at
BEFORE UPDATE ON public.calendar_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create synced_events table for storing external calendar events
CREATE TABLE public.synced_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID NOT NULL REFERENCES public.calendar_connections(id) ON DELETE CASCADE,
  external_event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  is_all_day BOOLEAN DEFAULT false,
  location TEXT,
  attendees JSONB DEFAULT '[]',
  status TEXT DEFAULT 'confirmed', -- 'confirmed', 'tentative', 'cancelled'
  is_busy BOOLEAN DEFAULT true,
  raw_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(connection_id, external_event_id)
);

-- Enable RLS
ALTER TABLE public.synced_events ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own synced events"
ON public.synced_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own synced events"
ON public.synced_events FOR ALL
USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_synced_events_updated_at
BEFORE UPDATE ON public.synced_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add working hours and preferences to booking_slots
ALTER TABLE public.booking_slots 
ADD COLUMN IF NOT EXISTS buffer_before_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS buffer_after_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS meeting_type TEXT DEFAULT 'one_on_one', -- 'one_on_one', 'group', 'round_robin'
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS confirmation_message TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';