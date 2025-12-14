import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, MessageSquare, Clock, Zap, Shield, Sparkles, Trophy, Flame, Star, Timer, Gift, Crown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CountdownTimer from "@/components/CountdownTimer";
import { useAuth } from "@/hooks/useAuth";
interface Offer {
  id: string;
  title: string;
  description: string;
  badge: string;
  icon: string;
  gradient: string;
  expires_at: string | null;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Gift,
  Crown,
  Star,
  Zap,
  Flame,
  Trophy,
  Timer,
};

const Index = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    const { data, error } = await supabase
      .from("limited_offers")
      .select("id, title, description, badge, icon, gradient, expires_at")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .limit(3);

    if (!error && data) {
      setOffers(data);
    }
    setLoadingOffers(false);
  };

  const features = [
    {
      icon: MessageSquare,
      title: "Natural Conversations",
      description: "Just tell the AI what you need in plain English. No complex interfaces."
    },
    {
      icon: Clock,
      title: "Smart Scheduling",
      description: "Automatically finds the best time slots based on your preferences."
    },
    {
      icon: Zap,
      title: "Instant Sync",
      description: "Syncs with your existing calendars in real-time."
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data is encrypted and never shared with third parties."
    }
  ];

  const featuredAchievements = [
    {
      icon: Flame,
      title: "7-Day Streak Master",
      description: "Complete events for 7 days straight",
      reward: "+50 XP",
      progress: 85
    },
    {
      icon: Trophy,
      title: "Productivity Champion",
      description: "Complete 100 events total",
      reward: "+200 XP",
      progress: 62
    },
    {
      icon: Timer,
      title: "Focus Warrior",
      description: "Use focus blocks for 20 hours",
      reward: "+100 XP",
      progress: 45
    }
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-8 animate-fade-in">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            👋 Welcome to Schedulr
          </div>
          
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight animate-fade-in delay-100">
            Your Friendly AI
            <br />
            <span className="text-gradient">Scheduling Assistant</span>
          </h1>

          <p className="mt-4 sm:mt-6 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in delay-200 px-2">
            Say goodbye to scheduling stress! Our friendly AI handles all your meetings, reminders, and plans — 
            just chat naturally and let us do the rest. ✨
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in delay-300 px-4">
            <Link to="/chat" className="w-full sm:w-auto">
              <Button variant="hero" size="xl" className="w-full sm:w-auto">
                🚀 Get Started Free
              </Button>
            </Link>
            <Link to="/pricing" className="w-full sm:w-auto">
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                See Plans
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm sm:text-base text-muted-foreground animate-fade-in delay-400">
            ❤️ Loved by thousands • <span className="font-semibold text-foreground">$29/month</span> after your free trial
          </p>
        </div>
      </section>

      {/* Limited Time Offers */}
      <section className="py-12 sm:py-16 px-4 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs sm:text-sm font-semibold mb-4 animate-pulse">
              <Timer className="w-4 h-4" />
              Limited Time Only
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">🔥 Hot Offers</h2>
            <p className="mt-3 text-sm sm:text-lg text-muted-foreground">
              Grab these deals before they expire!
            </p>
          </div>

          {loadingOffers ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : offers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {offers.map((offer, index) => {
                const IconComponent = iconMap[offer.icon] || Gift;
                return (
                  <div
                    key={offer.id}
                    className="relative p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-gradient-to-r ${offer.gradient} text-white text-xs font-semibold`}>
                      {offer.badge}
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${offer.gradient} flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="mt-4 font-semibold text-lg">{offer.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{offer.description}</p>
                    
                    {/* Countdown Timer */}
                    {offer.expires_at && (
                      <div className="mt-3 flex items-center gap-2">
                        <Timer className="w-4 h-4 text-destructive" />
                        <CountdownTimer expiresAt={offer.expires_at} />
                      </div>
                    )}
                    
                    <Link to="/register" className="mt-4 inline-block">
                      <Button variant="outline" size="sm" className="text-xs">
                        Claim Offer →
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No offers available right now. Check back soon!</p>
          )}
        </div>
      </section>

      {/* Featured Achievements - Only show for logged in users */}
      {user && (
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 text-accent-foreground text-xs sm:text-sm font-semibold mb-4">
                <Trophy className="w-4 h-4 text-accent" />
                Earn Rewards
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">🏆 Featured Achievements</h2>
              <p className="mt-3 text-sm sm:text-lg text-muted-foreground">
                Complete challenges and climb the leaderboard!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {featuredAchievements.map((achievement, index) => (
                <div
                  key={achievement.title}
                  className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <achievement.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <span className="px-2 py-1 rounded-full bg-accent/20 text-accent text-xs font-semibold">
                      {achievement.reward}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-lg">{achievement.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{achievement.description}</p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{achievement.progress}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full gradient-primary rounded-full transition-all duration-500"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link to="/gamification">
                <Button variant="outline" size="lg">
                  View All Achievements →
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-12 sm:py-20 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Simple as 1-2-3 🎯</h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto px-2">
            No complicated setup. Just tell us what you need and we'll handle the rest!
          </p>

          <div className="mt-10 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: "1", emoji: "💬", title: "Just Chat", desc: "Tell us what you need in your own words" },
              { step: "2", emoji: "🤖", title: "We Understand", desc: "Our friendly AI gets exactly what you mean" },
              { step: "3", emoji: "🎉", title: "All Done!", desc: "Your event is scheduled — that's it!" }
            ].map((item, index) => (
              <div key={item.step} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-card border border-border shadow-card text-2xl sm:text-3xl flex items-center justify-center mx-auto">
                  {item.emoji}
                </div>
                <h3 className="mt-3 sm:mt-4 font-semibold text-base sm:text-lg">{item.title}</h3>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Powerful Features</h2>
            <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-muted-foreground">
              Everything you need for effortless scheduling
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <h3 className="mt-3 sm:mt-4 font-semibold text-lg sm:text-xl">{feature.title}</h3>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-6 sm:p-12 rounded-2xl sm:rounded-3xl gradient-primary shadow-glow">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground">
              Ready to reclaim your time? 🙌
            </h2>
            <p className="mt-3 sm:mt-4 text-primary-foreground/80 text-sm sm:text-lg px-2">
              Join our happy community of users who save hours every week. We can't wait to help you too!
            </p>
            <Link to="/register" className="mt-6 sm:mt-8 inline-block w-full sm:w-auto">
              <Button variant="glass" size="xl" className="w-full sm:w-auto bg-background/20 text-primary-foreground border-primary-foreground/20 hover:bg-background/30">
                🎁 Start Your Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
