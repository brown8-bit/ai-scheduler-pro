import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Link2, 
  Copy, 
  Check, 
  Share2, 
  Mail, 
  MessageCircle,
  Twitter,
  Linkedin,
  ExternalLink,
  QrCode 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface SmartSchedulingLinkProps {
  publicSlug: string | null;
  title: string;
  isActive: boolean;
}

export const SmartSchedulingLink = ({ publicSlug, title, isActive }: SmartSchedulingLinkProps) => {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  
  if (!publicSlug) return null;
  
  const bookingUrl = `${window.location.origin}/book/${publicSlug}`;
  
  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied! 📋",
      description: "Share this link to let others book time with you.",
    });
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Book a meeting with me`);
    const body = encodeURIComponent(
      `Hi!\n\nI'd love to chat with you. Book a time that works for you using my scheduling link:\n\n${bookingUrl}\n\nLooking forward to connecting!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(`Book a meeting with me! 📅\n${bookingUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const shareViaLinkedIn = () => {
    const url = encodeURIComponent(bookingUrl);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank");
  };

  const shareViaSMS = () => {
    const text = encodeURIComponent(`Book a meeting with me: ${bookingUrl}`);
    window.open(`sms:?body=${text}`);
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Book a ${title}`,
          text: "Schedule a meeting with me!",
          url: bookingUrl,
        });
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== "AbortError") {
          console.error("Error sharing:", error);
        }
      }
    } else {
      copyLink();
    }
  };

  // Generate a simple QR code using a free API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bookingUrl)}`;

  return (
    <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20 p-4 sm:p-5 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Your Booking Link</h3>
        </div>
        {isActive ? (
          <span className="px-2 py-0.5 text-xs font-medium bg-green-500/10 text-green-600 rounded-full">
            Active
          </span>
        ) : (
          <span className="px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-600 rounded-full">
            Inactive
          </span>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">
        Share this link to let anyone book time on your calendar
      </p>

      <div className="flex gap-2 mb-3">
        <Input
          value={bookingUrl}
          readOnly
          className="bg-background/80 text-sm"
        />
        <Button onClick={copyLink} variant="default" size="icon" className="shrink-0">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {"share" in navigator && (
              <>
                <DropdownMenuItem onClick={shareNative}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share...
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={shareViaEmail}>
              <Mail className="w-4 h-4 mr-2" />
              Email
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareViaSMS}>
              <MessageCircle className="w-4 h-4 mr-2" />
              SMS / iMessage
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={shareViaTwitter}>
              <Twitter className="w-4 h-4 mr-2" />
              Twitter / X
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareViaLinkedIn}>
              <Linkedin className="w-4 h-4 mr-2" />
              LinkedIn
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={showQR} onOpenChange={setShowQR}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <QrCode className="w-4 h-4" />
              QR Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Scan to Book</DialogTitle>
              <DialogDescription>
                Share this QR code to let people book meetings with you
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-xl shadow-lg">
                <img 
                  src={qrCodeUrl} 
                  alt="Booking QR Code" 
                  className="w-48 h-48"
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {title}
              </p>
              <Button onClick={copyLink} variant="outline" className="gap-2">
                <Copy className="w-4 h-4" />
                Copy Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2"
          onClick={() => window.open(bookingUrl, "_blank")}
        >
          <ExternalLink className="w-4 h-4" />
          Preview
        </Button>
      </div>
    </div>
  );
};
