import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, MessageSquare, Clock, Zap, Shield, Sparkles } from "lucide-react";

const Index = () => {
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

  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            👋 Welcome to Schedulr
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight animate-fade-in delay-100">
            Your Friendly AI
            <br />
            <span className="text-gradient">Scheduling Assistant</span>
          </h1>

          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in delay-200">
            Say goodbye to scheduling stress! Our friendly AI handles all your meetings, reminders, and plans — 
            just chat naturally and let us do the rest. ✨
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in delay-300">
            <Link to="/chat">
              <Button variant="hero" size="xl">
                🚀 Get Started Free
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="xl">
                See Plans
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-muted-foreground animate-fade-in delay-400">
            ❤️ Loved by thousands • <span className="font-semibold text-foreground">$29/month</span> after your free trial
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Simple as 1-2-3 🎯</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            No complicated setup. Just tell us what you need and we'll handle the rest!
          </p>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", emoji: "💬", title: "Just Chat", desc: "Tell us what you need in your own words" },
              { step: "2", emoji: "🤖", title: "We Understand", desc: "Our friendly AI gets exactly what you mean" },
              { step: "3", emoji: "🎉", title: "All Done!", desc: "Your event is scheduled — that's it!" }
            ].map((item, index) => (
              <div key={item.step} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="w-16 h-16 rounded-2xl bg-card border border-border shadow-card text-3xl flex items-center justify-center mx-auto">
                  {item.emoji}
                </div>
                <h3 className="mt-4 font-semibold text-lg">{item.title}</h3>
                <p className="mt-2 text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold">Powerful Features</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need for effortless scheduling
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="p-6 rounded-2xl bg-card border border-border shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="mt-4 font-semibold text-xl">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl gradient-primary shadow-glow">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground">
              Ready to reclaim your time? 🙌
            </h2>
            <p className="mt-4 text-primary-foreground/80 text-lg">
              Join our happy community of users who save hours every week. We can't wait to help you too!
            </p>
            <Link to="/register" className="mt-8 inline-block">
              <Button variant="glass" size="xl" className="bg-background/20 text-primary-foreground border-primary-foreground/20 hover:bg-background/30">
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
