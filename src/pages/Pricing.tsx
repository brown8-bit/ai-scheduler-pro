import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Loader2, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Pricing = () => {
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingLifetime, setLoadingLifetime] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const features = [
    "Unlimited AI scheduling",
    "Calendar sync (Google, Outlook, Apple)",
    "Smart reminders",
    "Team collaboration",
    "Priority support",
    "Advanced analytics",
    "Custom integrations",
    "API access"
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
        window.open(data.url, "_blank");
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
        window.open(data.url, "_blank");
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

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
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
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto animate-slide-up delay-100">
            {/* Monthly Plan */}
            <div className="bg-card rounded-3xl shadow-card border border-border p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 gradient-primary opacity-10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold">Pro Plan</h2>
                  <p className="text-muted-foreground mt-2">Full access to all features</p>
                  
                  <div className="mt-6">
                    <span className="text-5xl font-bold">$29</span>
                    <span className="text-xl text-muted-foreground">/month</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    Billed monthly. Cancel anytime.
                  </p>
                </div>

                <Button 
                  variant="hero" 
                  size="xl" 
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

                <p className="text-center text-sm text-muted-foreground mt-4">
                  {user ? "Secure checkout powered by Stripe" : "14-day free trial. No credit card required."}
                </p>
              </div>
            </div>

            {/* Lifetime Plan */}
            <div className="bg-card rounded-3xl shadow-card border-2 border-primary p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 gradient-primary opacity-20 rounded-full blur-3xl" />
              <div className="absolute top-4 right-4">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  <Crown className="w-3 h-3" />
                  Best Value
                </div>
              </div>
              
              <div className="relative">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold">Lifetime</h2>
                  <p className="text-muted-foreground mt-2">One-time payment, forever access</p>
                  
                  <div className="mt-6">
                    <span className="text-5xl font-bold">$299</span>
                    <span className="text-xl text-muted-foreground"> one-time</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    Pay once, use forever. No recurring fees.
                  </p>
                </div>

                <Button 
                  variant="hero" 
                  size="xl" 
                  className="w-full"
                  onClick={handleLifetimePurchase}
                  disabled={loadingLifetime}
                >
                  {loadingLifetime ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : user ? (
                    "Get Lifetime Access"
                  ) : (
                    "Get Lifetime Access"
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Secure checkout powered by Stripe
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 max-w-2xl mx-auto animate-fade-in delay-200">
            <h3 className="font-semibold mb-6 text-center text-lg">Everything included in both plans:</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-16 text-center animate-fade-in delay-300">
            <h3 className="text-xl font-semibold mb-4">Questions?</h3>
            <p className="text-muted-foreground">
              Contact us at{" "}
              <a href="mailto:support@schedulr.com" className="text-primary hover:underline">
                support@schedulr.com
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
