import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay } from "date-fns";
import { CalendarDays, Clock, CheckCircle2 } from "lucide-react";

interface ScheduledEvent {
  id: string;
  title: string;
  event_date: string;
  description: string | null;
  category: string | null;
  is_completed: boolean | null;
}

const CalendarPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("scheduled_events")
      .select("*")
      .eq("user_id", user.id)
      .order("event_date", { ascending: true });

    if (!error && data) {
      setEvents(data);
    }
    setLoading(false);
  };

  const eventsForSelectedDate = events.filter((event) =>
    selectedDate && isSameDay(new Date(event.event_date), selectedDate)
  );

  const datesWithEvents = events.map((e) => new Date(e.event_date));

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      meeting: "bg-blue-500",
      reminder: "bg-amber-500",
      task: "bg-green-500",
      personal: "bg-purple-500",
      general: "bg-muted",
    };
    return colors[category || "general"] || colors.general;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="h-8 w-8 text-primary" />
            Calendar View
          </h1>
          <p className="text-muted-foreground mt-2">
            See all your scheduled events at a glance 📅
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                modifiers={{
                  hasEvent: datesWithEvents,
                }}
                modifiersStyles={{
                  hasEvent: {
                    backgroundColor: "hsl(var(--primary) / 0.2)",
                    borderRadius: "50%",
                  },
                }}
              />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsForSelectedDate.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events scheduled for this day</p>
                  <p className="text-sm mt-2">Use the AI assistant to schedule something! 🤖</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {eventsForSelectedDate.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div
                        className={`w-3 h-3 rounded-full mt-1.5 ${getCategoryColor(event.category)}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{event.title}</h3>
                          {event.is_completed && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.event_date), "h:mm a")}
                        </p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {event.category || "general"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default CalendarPage;
