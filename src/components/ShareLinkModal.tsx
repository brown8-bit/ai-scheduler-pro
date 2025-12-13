import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ShareLinkModalProps {
  trigger?: React.ReactNode;
}

const ShareLinkModal = ({ trigger }: ShareLinkModalProps) => {
  const { user } = useAuth();
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchBookingSlot();
    }
  }, [open, user]);

  const fetchBookingSlot = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("booking_slots")
        .select("public_slug")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.public_slug) {
        setBookingUrl(`${window.location.origin}/book/${data.public_slug}`);
      } else {
        // Create a booking slot if none exists
        const newSlug = `${user!.id.slice(0, 8)}-${Date.now().toString(36)}`;
        const { data: newSlot, error: insertError } = await supabase
          .from("booking_slots")
          .insert({
            user_id: user!.id,
            public_slug: newSlug,
            title: "30 Minute Meeting",
            duration_minutes: 30,
            start_hour: 9,
            end_hour: 17,
            available_days: [1, 2, 3, 4, 5],
            is_active: true
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setBookingUrl(`${window.location.origin}/book/${newSlot.public_slug}`);
      }
    } catch (error) {
      console.error("Error fetching booking slot:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (bookingUrl) {
      navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied! 📋",
        description: "Share this link to let others book time with you.",
      });
    }
  };

  const openLink = () => {
    if (bookingUrl) {
      window.open(bookingUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Your Booking Link
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : bookingUrl ? (
            <>
              <p className="text-sm text-muted-foreground">
                Anyone with this link can book time on your calendar.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={bookingUrl}
                  readOnly
                  className="flex-1 bg-secondary rounded-lg px-4 py-2 text-sm truncate"
                />
                <Button onClick={copyLink} variant="outline" size="icon">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button onClick={openLink} variant="outline" size="icon">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={copyLink} variant="hero" className="flex-1 gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy Link"}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Unable to load your booking link. Please try again.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareLinkModal;
