-- Create limited_offers table
CREATE TABLE public.limited_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  badge text NOT NULL,
  icon text NOT NULL DEFAULT 'Gift',
  gradient text NOT NULL DEFAULT 'from-primary to-accent',
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.limited_offers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active offers
CREATE POLICY "Anyone can view active offers"
ON public.limited_offers
FOR SELECT
USING (is_active = true);

-- Admins can manage all offers
CREATE POLICY "Admins can manage offers"
ON public.limited_offers
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_limited_offers_updated_at
BEFORE UPDATE ON public.limited_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default offers
INSERT INTO public.limited_offers (title, description, badge, icon, gradient, display_order) VALUES
('Holiday Special', 'Get 50% off your first 3 months', 'Ends Dec 25', 'Gift', 'from-red-500 to-orange-500', 1),
('Early Bird Pro', 'Unlock all premium features for $19/mo', 'Limited Spots', 'Crown', 'from-amber-500 to-yellow-500', 2),
('Refer & Earn', 'Get 1 month free for every friend who joins', 'New', 'Star', 'from-purple-500 to-pink-500', 3);