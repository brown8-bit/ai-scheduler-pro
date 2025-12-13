import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import DashboardCard from "@/components/DashboardCard";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Bell, Clock, Plus, MessageSquare, TrendingUp, CheckCircle, LogOut } from "lucide-react";
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
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

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
        .order("event_date", { ascending: true })
        .limit(10);

      if (error) throw error;
      setEvents(data || []);
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

  const stats = [
    { icon: Calendar, label: "Total Events", value: events.length.toString(), color: "primary" },
    { icon: CheckCircle, label: "Completed", value: "0", color: "green" },
    { icon: Clock, label: "Hours Saved", value: "0", color: "blue" },
    { icon: TrendingUp, label: "Productivity", value: "+0%", color: "purple" },
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
            <div className="flex gap-3">
              <Link to="/chat">
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Ask AI
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
            {stats.map((stat) => (
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
                      <DashboardCard
                        key={event.id}
                        title={event.title}
                        description={event.description || ""}
                        time={formatEventTime(event.event_date)}
                        icon={Clock}
                        variant={event.reminder ? "highlight" : "default"}
                      />
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
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Users className="w-4 h-4" />
                    Invite Team Member
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
