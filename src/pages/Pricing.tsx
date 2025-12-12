import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";

const Pricing = () => {
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
            <h1 className="text-4xl sm:text-5xl font-bold">One plan. Everything included.</h1>
            <p className="text-muted-foreground mt-4 text-lg max-w-xl mx-auto">
              No hidden fees. No complicated tiers. Just powerful AI scheduling for one simple price.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-lg mx-auto animate-slide-up delay-100">
            <div className="bg-card rounded-3xl shadow-card border border-border p-8 sm:p-10 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-40 h-40 gradient-primary opacity-10 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold">Pro Plan</h2>
                  <p className="text-muted-foreground mt-2">Full access to all features</p>
                  
                  <div className="mt-6">
                    <span className="text-6xl font-bold">$29</span>
                    <span className="text-2xl text-muted-foreground">/month</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    Billed monthly. Cancel anytime.
                  </p>
                </div>

                <Link to="/register">
                  <Button variant="hero" size="xl" className="w-full">
                    Start Free Trial
                  </Button>
                </Link>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  14-day free trial. No credit card required.
                </p>

                {/* Features */}
                <div className="mt-10 pt-8 border-t border-border">
                  <h3 className="font-semibold mb-4">Everything you need:</h3>
                  <ul className="space-y-3">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
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
