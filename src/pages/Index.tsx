import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, MessageSquare, Clock, Zap, Shield, Sparkles, Trophy, Flame, Star, Timer, Gift, Crown, Loader2, Rocket, Target, Lock, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import CountdownTimer from "@/components/CountdownTimer";
import { useAuth } from "@/hooks/useAuth";
import scheddyModern from "@/assets/scheddy-modern.png";
import WaitlistModal from "@/components/WaitlistModal";
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
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  useEffect(() => {
    fetchOffers();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    // Fetch profile and streak in parallel
    const [profileRes, streakRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .single()
    ]);

    if (profileRes.data) {
      setDisplayName(profileRes.data.display_name);
    }
    if (streakRes.data) {
      setCurrentStreak(streakRes.data.current_streak || 0);
    }
  };

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
      title: "AI Scheduling",
      description: "Schedule meetings, tasks, appointments, and activities with natural language."
    },
    {
      icon: Clock,
      title: "Balance Everything",
      description: "Smart scheduling that works around your work, personal life, and commitments."
    },
    {
      icon: Brain,
      title: "Smart Habit Tracking",
      description: "Integrated habit tracking with AI insights — no app switching. Schedulr analyzes your habits and auto-suggests schedule adjustments for better productivity."
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data stays private — we never sell it. Optional gamification features are just that: optional."
    }
  ];

  const featuredAchievements = [
    {
      icon: Flame,
      title: "7-Day Streak Master",
      description: "Complete habits for 7 days straight",
      reward: "+50 XP"
    },
    {
      icon: Trophy,
      title: "Productivity Champion",
      description: "Balance 50 work and personal tasks",
      reward: "+200 XP"
    },
    {
      icon: Timer,
      title: "Focus Champion",
      description: "Complete 20 focus sessions",
      reward: "+100 XP"
    }
  ];

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          {user ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-8 animate-fade-in">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                👋 Welcome back{displayName ? `, ${displayName}` : ''}!
              </div>
              
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight animate-fade-in delay-100">
                Ready to be
                <br />
                <span className="text-gradient">Productive Today?</span>
              </h1>

              {currentStreak > 0 && (
                <div className="mt-4 sm:mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent animate-fade-in delay-150">
                  <Flame className="w-5 h-5" />
                  <span className="font-semibold">{currentStreak} day streak!</span>
                  <span className="text-muted-foreground">Keep it going!</span>
                </div>
              )}

              <p className="mt-4 sm:mt-6 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in delay-200 px-2">
                Your AI assistant is ready to help you stay organized. What would you like to schedule today? ✨
              </p>
            </>
          ) : (
            <>
              {/* Scheddy Mascot */}
              <div className="mb-6 animate-fade-in flex justify-center">
                <div className="relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/30 via-purple-500/30 to-cyan-500/30 blur-2xl scale-110" />
                  
                  {/* Rotating border - properly sized */}
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-purple-500 to-cyan-500 animate-spin-slow opacity-60" />
                  
                  {/* Inner background to cover the rotating border */}
                  <div className="absolute inset-0 rounded-full bg-background" />
                  
                  {/* Avatar */}
                  <img 
                    src={scheddyModern} 
                    alt="Scheddy - Your AI Assistant" 
                    className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full shadow-2xl animate-float border-2 border-background"
                  />
                </div>
              </div>
              
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-8 animate-fade-in">
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                Your AI Scheduling Assistant ✨
              </div>
              
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight animate-fade-in delay-100">
                Master Your
                <br />
                <span className="text-gradient">Busy Life</span>
              </h1>

              <p className="mt-4 sm:mt-6 text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in delay-200 px-2">
                The AI-powered app to manage your schedule, track daily habits, 
                and crush your goals. Stay organized, earn points, and level up your productivity! 💪
              </p>
            </>
          )}

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in delay-300 px-4">
            {user ? (
              <>
                <Link to="/chat" className="w-full sm:w-auto">
                  <Button variant="hero" size="xl" className="w-full sm:w-auto">
                    💬 Open Chat
                  </Button>
                </Link>
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <Button variant="outline" size="xl" className="w-full sm:w-auto">
                    View Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>

          {!user && (
            <p className="mt-4 text-sm sm:text-base text-muted-foreground animate-fade-in delay-400">
              ✨ <span className="font-semibold text-foreground">Try free</span> — no signup required • <span className="font-semibold text-foreground">$29/month</span> after trial
            </p>
          )}
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
                    
                    <Link to={offer.title === "Early Bird Pro" ? "/pricing?plan=earlybird" : "/pricing?plan=lifetime"} className="mt-4 inline-block">
                      <Button size="sm" className="text-xs gradient-primary text-primary-foreground hover:opacity-90 animate-pulse-soft">
                        🔥 {offer.title === "Early Bird Pro" ? "Claim Early Bird →" : "Claim Lifetime Deal →"}
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

      {/* Coming Soon Section */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-semibold mb-4">
              <Rocket className="w-4 h-4" />
              Coming Soon
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">🚀 What's Next</h2>
            <p className="mt-3 text-sm sm:text-lg text-muted-foreground">
              Exciting features launching soon! Get notified when they're ready.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            {/* Focus Blocks */}
            <div className="relative p-5 sm:p-6 rounded-2xl bg-card border-2 border-dashed border-accent/30 overflow-hidden">
              <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-gradient-to-r from-accent to-primary text-white text-xs font-semibold">
                COMING SOON
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">Focus Blocks</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Schedule dedicated focus time and protect your productivity with distraction-free blocks.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded-full bg-accent/20 text-accent text-xs">Deep Work</span>
                <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs">Time Blocking</span>
                <span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs">Recurring</span>
              </div>
              <div className="mt-4">
                <WaitlistModal 
                  feature="focus_blocks"
                  featureTitle="Focus Blocks"
                  featureDescription="Get notified when Focus Blocks launches. Schedule distraction-free deep work sessions!"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Achievements - Only show for logged in users */}
      {user && (
        <section className="py-12 sm:py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 dark:bg-amber-500/30 text-accent-foreground dark:text-amber-300 text-xs sm:text-sm font-semibold mb-4">
                <Trophy className="w-4 h-4 text-accent dark:text-amber-400" />
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
                    <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                      <achievement.icon className="w-6 h-6 text-foreground" />
                    </div>
                    <span className="px-2 py-1 rounded-full bg-secondary text-foreground text-xs font-semibold">
                      {achievement.reward}
                    </span>
                  </div>
                  <h3 className="mt-4 font-semibold text-lg">{achievement.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{achievement.description}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link to="/achievements">
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">How It Works 🎯</h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto px-2">
            Stay organized and productive in three easy steps!
          </p>

          <div className="mt-10 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: "1", emoji: "📅", title: "Schedule with AI", desc: "Tell Scheddy what you need — meetings, tasks, reminders. Done in seconds." },
              { step: "2", emoji: "✅", title: "Track Your Habits", desc: "Built-in habit tracking with AI insights to optimize your schedule." },
              { step: "3", emoji: "🎯", title: "Stay Focused", desc: "Block focus time, set reminders, and optionally earn XP for motivation." }
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

      {/* Privacy Reassurance */}
      <section className="py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 sm:p-6 rounded-2xl bg-secondary/30 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-sm sm:text-base">Your data is private</p>
                <p className="text-xs sm:text-sm text-muted-foreground">We never sell your information</p>
              </div>
            </div>
            <Link to="/privacy" className="text-xs sm:text-sm text-primary hover:underline">
              Read our Privacy Policy →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-6 sm:p-12 rounded-2xl sm:rounded-3xl gradient-primary shadow-glow">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary-foreground">
              Ready to level up your productivity? 🏆
            </h2>
            <p className="mt-3 sm:mt-4 text-primary-foreground/80 text-sm sm:text-lg px-2">
              Stay organized, track your habits, and crush your goals — try it free today!
            </p>
            <Link to="/chat" className="mt-6 sm:mt-8 inline-block w-full sm:w-auto">
              <Button variant="glass" size="xl" className="w-full sm:w-auto bg-background/20 text-primary-foreground border-primary-foreground/20 hover:bg-background/30">
                🚀 Try Free — No Signup Required
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
