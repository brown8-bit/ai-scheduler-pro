-- Create admin_settings_changelog table for tracking changes
CREATE TABLE public.admin_settings_changelog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid NOT NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_settings_changelog ENABLE ROW LEVEL SECURITY;

-- Only admins can view changelog
CREATE POLICY "Admins can view changelog"
ON public.admin_settings_changelog
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert changelog entries
CREATE POLICY "Admins can insert changelog"
ON public.admin_settings_changelog
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_changelog_changed_at ON public.admin_settings_changelog(changed_at DESC);