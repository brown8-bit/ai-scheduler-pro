import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import DashboardCard from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Bell, Clock, Plus, MessageSquare, TrendingUp, CheckCircle, LogOut, BarChart3, Link2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ScheduledEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  reminder: boolean;
  category: string;
  is_completed: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    thisWeek: 0,
    categories: {} as Record<string, number>
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("scheduled_events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      
      const allEvents = data || [];
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Calculate stats
      const completed = allEvents.filter(e => e.is_completed).length;
      const thisWeek = allEvents.filter(e => {
        const eventDate = new Date(e.event_date);
        return eventDate >= now && eventDate <= weekFromNow;
      }).length;
      
      const categories: Record<string, number> = {};
      allEvents.forEach(e => {
        const cat = e.category || 'general';
        categories[cat] = (categories[cat] || 0) + 1;
      });

      setStats({
        total: allEvents.length,
        completed,
        thisWeek,
        categories
      });

      // Only show upcoming events (limit 10)
      const upcomingEvents = allEvents
        .filter(e => new Date(e.event_date) >= now && !e.is_completed)
        .slice(0, 10);
      
      setEvents(upcomingEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "See you next time! 👋",
    });
    navigate("/");
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === now.toDateString()) {
      return `Today at ${format(date, "h:mm a")}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${format(date, "h:mm a")}`;
    } else {
      return format(date, "EEEE, MMM d 'at' h:mm a");
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      work: "bg-blue-500",
      personal: "bg-green-500",
      health: "bg-red-500",
      social: "bg-purple-500",
      general: "bg-gray-500"
    };
    return colors[category] || colors.general;
  };

  const statCards = [
    { icon: Calendar, label: "Total Events", value: stats.total.toString(), color: "primary" },
    { icon: CheckCircle, label: "Completed", value: stats.completed.toString(), color: "green" },
    { icon: Clock, label: "This Week", value: stats.thisWeek.toString(), color: "blue" },
    { icon: TrendingUp, label: "Categories", value: Object.keys(stats.categories).length.toString(), color: "purple" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Hey there! 👋</h1>
              <p className="text-muted-foreground mt-1">Here's what's coming up — you've got this!</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/chat">
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Ask AI
                </Button>
              </Link>
              <Link to="/analytics">
                <Button variant="outline" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Button>
              </Link>
              <Link to="/booking-settings">
                <Button variant="outline" className="gap-2">
                  <Link2 className="w-4 h-4" />
                  Booking Page
                </Button>
              </Link>
              <Button variant="hero" className="gap-2" onClick={() => navigate("/chat")}>
                <Plus className="w-4 h-4" />
                New Event
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleSignOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl border border-border p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Events */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Events
                </h2>
                {eventsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No events scheduled yet!</p>
                    <Link to="/chat">
                      <Button variant="hero" className="gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Chat with AI to schedule
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
                        <div className={`w-3 h-3 rounded-full mt-1.5 ${getCategoryColor(event.category)}`} />
                        <div className="flex-1">
                          <h3 className="font-medium">{event.title}</h3>
                          {event.description && (
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          )}
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatEventTime(event.event_date)}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-secondary rounded-full capitalize">
                          {event.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/chat")}>
                    <Calendar className="w-4 h-4" />
                    Schedule Meeting
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/chat")}>
                    <Bell className="w-4 h-4" />
                    Set Reminder
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/booking-settings")}>
                    <Link2 className="w-4 h-4" />
                    Share Booking Link
                  </Button>
                </div>
              </div>

              {/* AI Assistant Card */}
              <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
                <h3 className="font-semibold text-lg mb-2">I'm here to help! 🤖</h3>
                <p className="text-primary-foreground/80 text-sm mb-4">
                  Just tell me what you need scheduled — I'll take care of the rest!
                </p>
                <Link to="/chat">
                  <Button variant="glass" className="w-full bg-background/20 border-primary-foreground/20 hover:bg-background/30">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Open AI Chat
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
