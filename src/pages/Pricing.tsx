import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Loader2, Crown, X, Flame, Clock, BadgeCheck, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Pricing = () => {
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingLifetime, setLoadingLifetime] = useState(false);
  const [loadingVerified, setLoadingVerified] = useState(false);
  const [loadingHoliday, setLoadingHoliday] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [highlightLifetime, setHighlightLifetime] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lifetimeRef = useRef<HTMLDivElement>(null);
  

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan === "lifetime") {
      setHighlightLifetime(true);
      setTimeout(() => {
        lifetimeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [searchParams]);

  const freeFeatures = [
    { name: "5 AI requests/month", included: true },
    { name: "Basic calendar view", included: true },
    { name: "1 event template", included: true },
    { name: "Calendar sync", included: false },
    { name: "Team collaboration", included: false },
    { name: "Priority support", included: false },
    { name: "Analytics", included: false },
    { name: "API access", included: false },
  ];


  const proFeatures = [
    { name: "100 AI requests/month", included: true },
    { name: "Full calendar view", included: true },
    { name: "10 event templates", included: true },
    { name: "Calendar sync", included: true },
    { name: "Team collaboration (5 members)", included: true },
    { name: "Email support", included: true },
    { name: "Basic analytics", included: true },
    { name: "API access", included: false },
  ];

  const holidayFeatures = [
    { name: "100 AI requests/month", included: true },
    { name: "Full calendar view", included: true },
    { name: "10 event templates", included: true },
    { name: "Calendar sync", included: true },
    { name: "Team collaboration (5 members)", included: true },
    { name: "Email support", included: true },
    { name: "Basic analytics", included: true },
  ];

  const verifiedFeatures = [
    { name: "Purple verification badge", included: true },
    { name: "Priority in leaderboards", included: true },
    { name: "Exclusive profile flair", included: true },
    { name: "Early access to features", included: true },
    { name: "Verified community status", included: true },
    { name: "Special support queue", included: true },
  ];

  const lifetimeFeatures = [
    { name: "Unlimited AI requests", included: true },
    { name: "Full calendar view", included: true },
    { name: "Unlimited templates", included: true },
    { name: "Calendar sync", included: true },
    { name: "Unlimited team members", included: true },
    { name: "Priority support", included: true },
    { name: "Advanced analytics", included: true },
    { name: "Full API access", included: true },
    { name: "Community access", included: true },
  ];


  const handleSubscribe = async () => {
    if (!user) {
      navigate("/register");
      return;
    }

    setLoadingMonthly(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingMonthly(false);
    }
  };

  const handleLifetimePurchase = async () => {
    if (!user) {
      navigate("/register");
      return;
    }

    setLoadingLifetime(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-lifetime-payment");
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Lifetime purchase error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingLifetime(false);
    }
  };

  const handleVerifiedPurchase = async () => {
    if (!user) {
      navigate("/register");
      return;
    }

    setLoadingVerified(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-verified-checkout");
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Verified checkout error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingVerified(false);
    }
  };

  const handleHolidayPurchase = async () => {
    if (!user) {
      navigate("/register");
      return;
    }

    setLoadingHoliday(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-holiday-checkout");
      
      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Holiday checkout error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingHoliday(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Simple Pricing
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold">Choose your plan</h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-xl mx-auto">
              No hidden fees. Just powerful AI scheduling for one simple price.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 max-w-7xl mx-auto animate-slide-up delay-100">
            {/* Free Plan */}
            <div className="bg-card rounded-3xl shadow-card border border-border p-6 relative overflow-hidden">
              <div className="relative">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold">Free</h2>
                  <p className="text-muted-foreground mt-2 text-sm">Get started with basics</p>
                  
                  <div className="mt-6">
                    <span className="text-5xl font-bold">$0</span>
                    <span className="text-xl text-muted-foreground">/month</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    Limited features
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full"
                  onClick={() => navigate(user ? "/dashboard" : "/register")}
                >
                  {user ? "Current Plan" : "Get Started"}
                </Button>

                <div className="mt-6 space-y-3">
                  {freeFeatures.map((feature) => (
                    <div key={feature.name} className="flex items-center gap-3">
                      {feature.included ? (
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <X className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                      <span className={feature.included ? "text-foreground text-sm" : "text-muted-foreground text-sm line-through"}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly Plan */}
            <div className="bg-card rounded-3xl shadow-card border border-border p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 gradient-primary opacity-10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold">Pro</h2>
                  <p className="text-muted-foreground mt-2 text-sm">Full access to all features</p>
                  
                  <div className="mt-6">
                    <span className="text-5xl font-bold">$29</span>
                    <span className="text-xl text-muted-foreground">/month</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    Cancel anytime
                  </p>
                </div>

                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={handleSubscribe}
                  disabled={loadingMonthly}
                >
                  {loadingMonthly ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : user ? (
                    "Subscribe Now"
                  ) : (
                    "Start Free Trial"
                  )}
                </Button>

                <div className="mt-6 space-y-3">
                  {proFeatures.map((feature) => (
                    <div key={feature.name} className="flex items-center gap-3">
                      {feature.included ? (
                        <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <X className="w-3 h-3 text-muted-foreground" />
                        </div>
                      )}
                      <span className={feature.included ? "text-foreground text-sm" : "text-muted-foreground text-sm line-through"}>
                        {feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 🔥 Holiday Special - VERY LIMITED */}
            <div className="bg-card rounded-3xl shadow-card border-2 border-red-500 p-6 relative overflow-hidden ring-4 ring-red-500/30 animate-pulse-soft">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-500 to-orange-500 opacity-20 rounded-full blur-3xl" />
              <div className="absolute -top-1 -left-1 -right-1 bg-gradient-to-r from-red-600 to-orange-500 text-white text-center py-1 text-xs font-bold tracking-wider">
                ⚡ ONLY 10 SPOTS LEFT ⚡
              </div>
              <div className="absolute top-10 right-2">
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse">
                  <Flame className="w-3 h-3" />
                  SELLING FAST
                </div>
              </div>
              
              <div className="relative pt-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-red-500 flex items-center justify-center gap-2">
                    <Flame className="w-5 h-5" />
                    Holiday Special
                    <Flame className="w-5 h-5" />
                  </h2>
                  <p className="text-muted-foreground mt-2 text-xs">Pro features at insane price</p>
                  
                  <div className="mt-4">
                    <span className="text-lg text-muted-foreground line-through mr-2">$29</span>
                    <span className="text-4xl font-bold text-red-500">$25</span>
                    <span className="text-lg text-muted-foreground">/mo</span>
                  </div>
                  
                  <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold">
                    <Zap className="w-3 h-3" />
                    14% OFF FOREVER
                  </div>
                  
                  <p className="text-xs text-red-500 font-semibold mt-2 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    Ends Dec 25th!
                  </p>
                </div>

                <Button 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold shadow-lg"
                  onClick={handleHolidayPurchase}
                  disabled={loadingHoliday}
                >
                  {loadingHoliday ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Claim Now
                    </>
                  )}
                </Button>

                <div className="mt-4 space-y-2">
                  {holidayFeatures.map((feature) => (
                    <div key={feature.name} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-foreground text-xs">{feature.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Verified Plan */}
            <div className="bg-card rounded-3xl shadow-card border-2 border-violet-500 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500 opacity-10 rounded-full blur-3xl" />
              <div className="absolute top-4 right-4">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-500 text-white text-xs font-semibold">
                  <BadgeCheck className="w-3 h-3" />
                  Status
                </div>
              </div>
              
              <div className="relative">
                <div className="text-center mb-6 pt-4">
                  <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                    Verified
                    <BadgeCheck className="w-6 h-6 text-violet-500 fill-violet-500" />
                  </h2>
                  <p className="text-muted-foreground mt-2 text-sm">Stand out from the crowd</p>
                  
                  <div className="mt-6">
                    <span className="text-5xl font-bold">$19</span>
                    <span className="text-xl text-muted-foreground">/month</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    Cancel anytime
                  </p>
                </div>

                <Button 
                  size="lg" 
                  className="w-full bg-violet-500 hover:bg-violet-600 text-white"
                  onClick={handleVerifiedPurchase}
                  disabled={loadingVerified}
                >
                  {loadingVerified ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <BadgeCheck className="w-4 h-4 mr-2" />
                      Get Verified
                    </>
                  )}
                </Button>

                <div className="mt-6 space-y-3">
                  {verifiedFeatures.map((feature) => (
                    <div key={feature.name} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-foreground text-sm">{feature.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lifetime Plan */}
            <div 
              ref={lifetimeRef}
              className={`bg-card rounded-3xl shadow-card border-2 p-6 relative overflow-hidden transition-all duration-500 ${
                highlightLifetime 
                  ? "border-primary ring-4 ring-primary/30 scale-105 shadow-glow" 
                  : "border-primary"
              }`}
            >
              <div className="absolute top-0 right-0 w-40 h-40 gradient-primary opacity-20 rounded-full blur-3xl" />
              <div className="absolute top-4 right-4">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold animate-pulse-soft">
                  <Crown className="w-3 h-3" />
                  Best Value
                </div>
              </div>
              
              {highlightLifetime && (
                <div className="absolute top-4 left-4">
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold animate-pulse">
                    <Flame className="w-3 h-3" />
                    LIMITED!
                  </div>
                </div>
              )}
              
              <div className="relative">
                <div className="text-center mb-6 pt-4">
                  <h2 className="text-2xl font-bold">Lifetime</h2>
                  <p className="text-muted-foreground mt-2 text-sm">One-time payment, forever</p>
                  
                  <div className="mt-6">
                    <span className="text-xl text-muted-foreground line-through mr-2">$299</span>
                    <span className="text-5xl font-bold text-primary">$160</span>
                    <span className="text-xl text-muted-foreground"> once</span>
                  </div>
                  
                  {highlightLifetime ? (
                    <p className="text-sm text-destructive font-semibold mt-2 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3" />
                      Offer ends soon!
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">
                      No recurring fees
                    </p>
                  )}
                </div>

                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={handleLifetimePurchase}
                  disabled={loadingLifetime}
                >
                  {loadingLifetime ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Get Lifetime Access"
                  )}
                </Button>

                <div className="mt-6 space-y-3">
                  {lifetimeFeatures.map((feature) => (
                    <div key={feature.name} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                      <span className="text-foreground text-sm">{feature.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16 text-center animate-fade-in delay-300">
            <h3 className="text-xl font-semibold mb-4">Questions?</h3>
            <p className="text-muted-foreground">
              Contact us at{" "}
              <a href="mailto:Support@schedulr.com" className="text-primary hover:underline">
                Support@schedulr.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;
