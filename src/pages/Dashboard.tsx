import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  Bell, 
  Clock, 
  Plus, 
  MessageSquare, 
  TrendingUp, 
  CheckCircle, 
  BarChart3, 
  Link2,
  Flame,
  Target,
  Sparkles,
  Users,
  CalendarCheck,
  ChevronRight,
  Check
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format, isToday, isTomorrow, startOfWeek, endOfWeek } from "date-fns";
import scheddyAvatar from "@/assets/scheddy-avatar.png";

interface ScheduledEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  reminder: boolean;
  category: string;
  is_completed: boolean;
}

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  booking_date: string;
  booking_time: string;
  status: string;
  created_at: string;
}

interface UserStreak {
  current_streak: number;
  longest_streak: number;
  total_events_completed: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    thisWeek: 0,
    todayCount: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchBookings();
      fetchStreak();
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
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);
      
      const completed = allEvents.filter(e => e.is_completed).length;
      const thisWeek = allEvents.filter(e => {
        const eventDate = new Date(e.event_date);
        return eventDate >= weekStart && eventDate <= weekEnd;
      }).length;
      const todayCount = allEvents.filter(e => isToday(new Date(e.event_date))).length;

      setStats({
        total: allEvents.length,
        completed,
        thisWeek,
        todayCount
      });

      const upcomingEvents = allEvents
        .filter(e => new Date(e.event_date) >= now && !e.is_completed)
        .slice(0, 5);
      
      setEvents(upcomingEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  const fetchStreak = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setStreak(data);
      }
    } catch (error) {
      // No streak yet, that's okay
    }
  };

  const markEventComplete = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("scheduled_events")
        .update({ is_completed: true })
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Nice work! 🎉",
        description: "Event marked as complete.",
      });

      // Update local state
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setStats(prev => ({
        ...prev,
        completed: prev.completed + 1
      }));

      // Update streak
      if (user) {
        const today = new Date().toISOString().split('T')[0];
        await supabase
          .from("user_streaks")
          .upsert({
            user_id: user.id,
            current_streak: (streak?.current_streak || 0) + 1,
            total_events_completed: (streak?.total_events_completed || 0) + 1,
            last_activity_date: today
          }, { onConflict: "user_id" });
        
        fetchStreak();
      }
    } catch (error) {
      console.error("Error completing event:", error);
      toast({
        title: "Error",
        description: "Failed to complete event.",
        variant: "destructive",
      });
    }
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, "h:mm a")}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, "h:mm a")}`;
    } else {
      return format(date, "EEE, MMM d 'at' h:mm a");
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      work: "bg-blue-500",
      personal: "bg-green-500",
      health: "bg-red-500",
      social: "bg-purple-500",
      general: "bg-primary"
    };
    return colors[category] || colors.general;
  };

  const productivityTips = [
    "🎯 Try batching similar tasks together for better focus!",
    "☕ Take a 5-minute break every 25 minutes to stay fresh.",
    "📝 Start your day by reviewing your top 3 priorities.",
    "🧘 Schedule focus blocks to protect your deep work time.",
    "✨ Celebrate small wins to build momentum!"
  ];

  const randomTip = productivityTips[Math.floor(Math.random() * productivityTips.length)];

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-3 sm:px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Welcome back! 👋</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                {stats.todayCount > 0 
                  ? `You have ${stats.todayCount} event${stats.todayCount > 1 ? 's' : ''} today. Let's crush it!`
                  : "Your schedule is clear today. Time to plan ahead!"
                }
              </p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Link to="/calendar" className="flex-1 sm:flex-none">
                <Button variant="outline" className="gap-2 w-full sm:w-auto text-xs sm:text-sm">
                  <CalendarCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </Button>
              </Link>
              <Button variant="hero" className="gap-2 flex-1 sm:flex-none text-xs sm:text-sm" onClick={() => navigate("/chat")}>
                <Plus className="w-4 h-4" />
                New Event
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-card rounded-xl border border-border p-3 sm:p-5 shadow-card hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Events</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-3 sm:p-5 shadow-card hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{stats.completed}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Completed</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-3 sm:p-5 shadow-card hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{stats.thisWeek}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">This Week</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-3 sm:p-5 shadow-card hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-bold">{streak?.current_streak || 0}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Day Streak</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Left Column - Events */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Upcoming Events */}
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-card">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="text-base sm:text-xl font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Upcoming Events
                  </h2>
                  <Link to="/calendar">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs sm:text-sm">
                      View all <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </Link>
                </div>
                {eventsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-primary/20">
                      <img src={scheddyAvatar} alt="Scheddy" className="w-full h-full object-cover" />
                    </div>
                    <p className="text-muted-foreground mb-2">No upcoming events!</p>
                    <p className="text-sm text-muted-foreground mb-4">Chat with Scheddy to get started</p>
                    <Link to="/chat">
                      <Button variant="hero" className="gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Chat with Scheddy
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border hover:bg-secondary/70 transition-colors group">
                        <div className={`w-3 h-3 rounded-full ${getCategoryColor(event.category)}`} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatEventTime(event.event_date)}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-secondary rounded-full capitalize hidden sm:block">
                          {event.category}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => markEventComplete(event.id)}
                          title="Mark as complete"
                        >
                          <Check className="w-4 h-4 text-green-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Bookings */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    Recent Bookings
                  </h2>
                  <Link to="/booking-settings">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Manage <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                {bookings.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground text-sm mb-3">No bookings yet</p>
                    <Link to="/booking-settings">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Link2 className="w-4 h-4" />
                        Set up booking page
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.slice(0, 3).map((booking) => (
                      <div key={booking.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-medium">
                            {booking.guest_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{booking.guest_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(booking.booking_date), "MMM d")} at {booking.booking_time}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-500/10 text-green-600' 
                            : 'bg-yellow-500/10 text-yellow-600'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Progress Card */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Your Progress
                </h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-medium">{completionRate}%</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="text-center p-3 rounded-lg bg-secondary/50">
                      <p className="text-2xl font-bold text-primary">{streak?.current_streak || 0}</p>
                      <p className="text-xs text-muted-foreground">Current Streak</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-secondary/50">
                      <p className="text-2xl font-bold">{streak?.longest_streak || 0}</p>
                      <p className="text-xs text-muted-foreground">Best Streak</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Quick Actions
                </h2>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/chat")}>
                    <Calendar className="w-4 h-4" />
                    Schedule Meeting
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/templates")}>
                    <Sparkles className="w-4 h-4" />
                    Use Template
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/focus")}>
                    <Clock className="w-4 h-4" />
                    Focus Blocks
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/analytics")}>
                    <BarChart3 className="w-4 h-4" />
                    View Analytics
                  </Button>
                </div>
              </div>

              {/* Productivity Tip */}
              <div className="bg-accent/10 border border-accent/20 rounded-xl p-5">
                <h3 className="font-semibold flex items-center gap-2 text-accent-foreground mb-2">
                  <TrendingUp className="w-4 h-4" />
                  Productivity Tip
                </h3>
                <p className="text-sm text-muted-foreground">{randomTip}</p>
              </div>

              {/* AI Assistant Card */}
              <div className="gradient-primary rounded-xl p-6 text-primary-foreground">
                <h3 className="font-semibold text-lg mb-2">Need help? 🤖</h3>
                <p className="text-primary-foreground/80 text-sm mb-4">
                  Just tell me what you need — I'll handle the scheduling!
                </p>
                <Link to="/chat">
                  <Button variant="glass" className="w-full bg-background/20 border-primary-foreground/20 hover:bg-background/30">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat with AI
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
