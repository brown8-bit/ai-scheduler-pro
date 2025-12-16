-- Voice notes table
CREATE TABLE public.voice_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Note',
  audio_url text NOT NULL,
  duration_seconds integer,
  transcript text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own voice notes" ON public.voice_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own voice notes" ON public.voice_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own voice notes" ON public.voice_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own voice notes" ON public.voice_notes FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', true);

CREATE POLICY "Users can upload voice notes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view their voice notes" ON storage.objects FOR SELECT USING (bucket_id = 'voice-notes');
CREATE POLICY "Users can delete their voice notes" ON storage.objects FOR DELETE USING (bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1]);