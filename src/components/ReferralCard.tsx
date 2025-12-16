import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Gift, Users, Check, Share2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Referral {
  id: string;
  status: string;
  coupon_code: string | null;
  reward_claimed: boolean;
  created_at: string;
}

export const ReferralCard = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;

    try {
      // Fetch user's referral code
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("user_id", user.id)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }

      // Fetch referrals made by this user
      const { data: referralData } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });

      if (referralData) {
        setReferrals(referralData);
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referralCode) return;
    
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (!referralCode) return;
    
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Schedulr!",
          text: "Check out Schedulr - the AI-powered scheduling assistant!",
          url: referralLink,
        });
      } catch (error) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  const completedReferrals = referrals.filter(r => r.status === "completed").length;
  const pendingRewards = referrals.filter(r => r.coupon_code && !r.reward_claimed).length;

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Refer Friends, Get Rewards</CardTitle>
        </div>
        <CardDescription>
          Share Schedulr and earn 50% off your next month when friends sign up!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">{completedReferrals}</p>
            <p className="text-xs text-muted-foreground">Friends Referred</p>
          </div>
          <div className="bg-background/50 rounded-lg p-3 text-center">
            <Gift className="h-5 w-5 mx-auto mb-1 text-accent" />
            <p className="text-2xl font-bold">{pendingRewards}</p>
            <p className="text-xs text-muted-foreground">Rewards Available</p>
          </div>
        </div>

        {/* Referral Code */}
        {referralCode && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Referral Code</label>
            <div className="flex gap-2">
              <Input 
                value={referralCode} 
                readOnly 
                className="font-mono text-center bg-background"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyReferralLink}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {/* Share Button */}
        <Button 
          className="w-full" 
          onClick={shareReferral}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Referral Link
        </Button>

        {/* Available Rewards */}
        {pendingRewards > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Reward Codes</label>
            <div className="space-y-2">
              {referrals
                .filter(r => r.coupon_code && !r.reward_claimed)
                .map(r => (
                  <div 
                    key={r.id} 
                    className="flex items-center justify-between bg-background/50 rounded-lg p-3"
                  >
                    <code className="text-sm font-mono">{r.coupon_code}</code>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                      50% Off
                    </Badge>
                  </div>
                ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Use these codes at checkout to get 50% off!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
