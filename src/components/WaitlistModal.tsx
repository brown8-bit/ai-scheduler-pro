import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface WaitlistModalProps {
  feature: string;
  featureTitle: string;
  featureDescription: string;
  trigger?: React.ReactNode;
}

const WaitlistModal = ({ feature, featureTitle, featureDescription, trigger }: WaitlistModalProps) => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert({ email: email.trim().toLowerCase(), feature });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already on the list!",
            description: "You're already signed up for this feature.",
          });
          setSuccess(true);
        } else {
          throw error;
        }
      } else {
        setSuccess(true);
        toast({
          title: "You're on the list! 🎉",
          description: `We'll notify you when ${featureTitle} launches.`,
        });
      }
    } catch (error: any) {
      console.error("Waitlist signup error:", error);
      toast({
        title: "Error",
        description: "Failed to join waitlist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSuccess(false);
      if (!user?.email) setEmail("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline" className="gap-2">
            <Bell className="w-4 h-4" />
            Notify Me
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Get Notified
          </DialogTitle>
          <DialogDescription>
            {featureDescription}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">You're on the list!</h3>
            <p className="text-muted-foreground text-sm">
              We'll send you an email when {featureTitle} is ready.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Notify Me When Ready
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              We'll only email you about {featureTitle}. No spam.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WaitlistModal;
