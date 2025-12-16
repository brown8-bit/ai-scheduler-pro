import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Copy, 
  Gift, 
  Users, 
  Check, 
  Share2, 
  Trophy, 
  Clock, 
  Ticket,
  ArrowRight,
  Sparkles,
  Star
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Referral {
  id: string;
  status: string;
  coupon_code: string | null;
  reward_claimed: boolean;
  created_at: string;
  completed_at: string | null;
}

const Referrals = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchReferralData();
    }
  }, [user]);

  const fetchReferralData = async () => {
    if (!user) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("user_id", user.id)
        .single();

      if (profile?.referral_code) {
        setReferralCode(profile.referral_code);
      }

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
      setDataLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referralCode) return;
    
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyReferralCode = async () => {
    if (!referralCode) return;
    await navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (!referralCode) return;
    
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Schedulr!",
          text: "Sign up for Schedulr using my referral link and we both get rewards!",
          url: referralLink,
        });
      } catch {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  const completedReferrals = referrals.filter(r => r.status === "completed").length;
  const pendingReferrals = referrals.filter(r => r.status === "pending").length;
  const availableRewards = referrals.filter(r => r.coupon_code && !r.reward_claimed);
  const claimedRewards = referrals.filter(r => r.coupon_code && r.reward_claimed);

  // Milestone rewards
  const milestones = [
    { count: 1, reward: "50% Off Coupon", achieved: completedReferrals >= 1 },
    { count: 3, reward: "Free Month of Pro", achieved: completedReferrals >= 3 },
    { count: 5, reward: "Exclusive Badge", achieved: completedReferrals >= 5 },
    { count: 10, reward: "Lifetime VIP Status", achieved: completedReferrals >= 10 },
  ];

  const nextMilestone = milestones.find(m => !m.achieved);
  const progressToNext = nextMilestone 
    ? Math.min((completedReferrals / nextMilestone.count) * 100, 100)
    : 100;

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-secondary/30">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Gift className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Share Schedulr with friends and earn rewards! Get 50% off your next month for every friend who signs up.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold">{completedReferrals}</p>
                <p className="text-sm text-muted-foreground">Friends Referred</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-3xl font-bold">{pendingReferrals}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Ticket className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-3xl font-bold">{availableRewards.length}</p>
                <p className="text-sm text-muted-foreground">Rewards Available</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Trophy className="w-8 h-8 mx-auto mb-2 text-accent" />
                <p className="text-3xl font-bold">{claimedRewards.length}</p>
                <p className="text-sm text-muted-foreground">Rewards Used</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Share & Milestones */}
            <div className="lg:col-span-2 space-y-6">
              {/* Share Card */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="w-5 h-5" />
                    Share Your Link
                  </CardTitle>
                  <CardDescription>
                    Share your unique referral link with friends. When they sign up, you both win!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {referralCode && (
                    <>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Your Referral Code</label>
                        <div className="flex gap-2">
                          <Input 
                            value={referralCode} 
                            readOnly 
                            className="font-mono text-lg text-center bg-background"
                          />
                          <Button variant="outline" onClick={copyReferralCode}>
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Your Referral Link</label>
                        <div className="flex gap-2">
                          <Input 
                            value={`${window.location.origin}/register?ref=${referralCode}`}
                            readOnly 
                            className="text-sm bg-background"
                          />
                          <Button variant="outline" onClick={copyReferralLink}>
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <Button className="w-full" size="lg" onClick={shareReferral}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share with Friends
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-accent" />
                    Referral Milestones
                  </CardTitle>
                  <CardDescription>
                    Unlock bonus rewards as you refer more friends
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {nextMilestone && (
                    <div className="mb-6 p-4 rounded-lg bg-secondary/50">
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress to next reward</span>
                        <span className="font-medium">{completedReferrals}/{nextMilestone.count} referrals</span>
                      </div>
                      <Progress value={progressToNext} className="h-2 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {nextMilestone.count - completedReferrals} more to unlock: <span className="font-medium text-primary">{nextMilestone.reward}</span>
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    {milestones.map((milestone, index) => (
                      <div 
                        key={index}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          milestone.achieved 
                            ? "bg-green-500/10 border-green-500/20" 
                            : "bg-secondary/30 border-border"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          milestone.achieved ? "bg-green-500" : "bg-muted"
                        }`}>
                          {milestone.achieved ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : (
                            <Star className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{milestone.count} Referral{milestone.count > 1 ? "s" : ""}</p>
                          <p className="text-sm text-muted-foreground">{milestone.reward}</p>
                        </div>
                        {milestone.achieved && (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                            Unlocked!
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Rewards & History */}
            <div className="space-y-6">
              {/* Available Rewards */}
              <Card className="border-green-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-green-500" />
                    Your Rewards
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {availableRewards.length === 0 ? (
                    <div className="text-center py-6">
                      <Gift className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No rewards yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Refer friends to earn 50% off coupons!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableRewards.map((reward) => (
                        <div 
                          key={reward.id}
                          className="p-4 rounded-lg bg-green-500/10 border border-green-500/20"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge className="bg-green-500 text-white">50% OFF</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(reward.created_at), "MMM d, yyyy")}
                            </span>
                          </div>
                          <code className="text-sm font-mono block mb-2">{reward.coupon_code}</code>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              navigator.clipboard.writeText(reward.coupon_code || "");
                              toast.success("Coupon code copied!");
                            }}
                          >
                            <Copy className="w-3 h-3 mr-2" />
                            Copy Code
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Referral History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Referral History</CardTitle>
                </CardHeader>
                <CardContent>
                  {referrals.length === 0 ? (
                    <div className="text-center py-6">
                      <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">No referrals yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Share your link to get started!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {referrals.slice(0, 10).map((referral) => (
                        <div 
                          key={referral.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                        >
                          <div>
                            <Badge 
                              variant="secondary"
                              className={
                                referral.status === "completed" 
                                  ? "bg-green-500/10 text-green-600" 
                                  : "bg-yellow-500/10 text-yellow-600"
                              }
                            >
                              {referral.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(referral.created_at), "MMM d, yyyy")}
                            </p>
                          </div>
                          {referral.coupon_code && (
                            <Badge variant="outline" className="text-xs">
                              Reward earned
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* How It Works */}
              <Card className="bg-secondary/30">
                <CardHeader>
                  <CardTitle className="text-lg">How It Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Share your link</p>
                      <p className="text-xs text-muted-foreground">Send your unique referral link to friends</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Friend signs up</p>
                      <p className="text-xs text-muted-foreground">They create an account using your link</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">You get rewarded!</p>
                      <p className="text-xs text-muted-foreground">Receive a 50% off coupon instantly</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Referrals;
