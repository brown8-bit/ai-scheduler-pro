import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Loader2, Crown, X } from "lucide-react";
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

  const lifetimeFeatures = [
    { name: "Unlimited AI requests", included: true },
    { name: "Full calendar view", included: true },
    { name: "Unlimited templates", included: true },
    { name: "Calendar sync", included: true },
    { name: "Unlimited team members", included: true },
    { name: "Priority support", included: true },
    { name: "Advanced analytics", included: true },
    { name: "Full API access", included: true },
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
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto animate-slide-up delay-100">
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

            {/* Lifetime Plan */}
            <div className="bg-card rounded-3xl shadow-card border-2 border-primary p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 gradient-primary opacity-20 rounded-full blur-3xl" />
              <div className="absolute top-4 right-4">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  <Crown className="w-3 h-3" />
                  Best Value
                </div>
              </div>
              
              <div className="relative">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold">Lifetime</h2>
                  <p className="text-muted-foreground mt-2 text-sm">One-time payment, forever</p>
                  
                  <div className="mt-6">
                    <span className="text-5xl font-bold">$299</span>
                    <span className="text-xl text-muted-foreground"> once</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    No recurring fees
                  </p>
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
