import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isSameDay } from "date-fns";
import { CalendarDays, Clock, CheckCircle2, Plus, Trash2 } from "lucide-react";
import AddEventModal from "@/components/AddEventModal";
import CalendarExport from "@/components/CalendarExport";
import ScheddyLoader from "@/components/ScheddyLoader";
import { toast } from "@/hooks/use-toast";

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

  const handleToggleComplete = async (event: ScheduledEvent) => {
    const { error } = await supabase
      .from("scheduled_events")
      .update({ is_completed: !event.is_completed })
      .eq("id", event.id);

    if (!error) {
      fetchEvents();
      toast({
        title: event.is_completed ? "Marked as incomplete" : "Nice work! ✅",
        description: event.is_completed 
          ? `"${event.title}" is back on your list.`
          : `"${event.title}" completed!`,
      });
    }
  };

  const handleDeleteEvent = async (event: ScheduledEvent) => {
    const { error } = await supabase
      .from("scheduled_events")
      .delete()
      .eq("id", event.id);

    if (!error) {
      fetchEvents();
      toast({
        title: "Event removed",
        description: `"${event.title}" has been deleted.`,
      });
    }
  };

  const eventsForSelectedDate = events.filter((event) =>
    selectedDate && isSameDay(new Date(event.event_date), selectedDate)
  );

  const datesWithEvents = events.map((e) => new Date(e.event_date));

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      work: "bg-blue-500",
      personal: "bg-purple-500",
      health: "bg-green-500",
      social: "bg-pink-500",
      general: "bg-muted",
    };
    return colors[category || "general"] || colors.general;
  };

  if (loading) {
    return <ScheddyLoader message="Loading your calendar..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Calendar View
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              See all your scheduled events at a glance 📅
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <CalendarExport events={events} />
            {user && (
              <AddEventModal 
                userId={user.id} 
                selectedDate={selectedDate}
                onEventAdded={fetchEvents}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Select Date</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border mx-auto pointer-events-auto"
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
              </CardTitle>
              {user && selectedDate && (
                <AddEventModal 
                  userId={user.id} 
                  selectedDate={selectedDate}
                  onEventAdded={fetchEvents}
                  trigger={
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  }
                />
              )}
            </CardHeader>
            <CardContent>
              {eventsForSelectedDate.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events scheduled for this day</p>
                  <p className="text-sm mt-2 mb-4">Click the button below to add one!</p>
                  {user && (
                    <AddEventModal 
                      userId={user.id} 
                      selectedDate={selectedDate}
                      onEventAdded={fetchEvents}
                      trigger={
                        <Button variant="outline" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Event
                        </Button>
                      }
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {eventsForSelectedDate.map((event) => (
                    <div
                      key={event.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors ${
                        event.is_completed ? "opacity-60" : ""
                      }`}
                    >
                      <button
                        onClick={() => handleToggleComplete(event)}
                        className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center transition-colors ${
                          event.is_completed 
                            ? "bg-green-500 border-green-500" 
                            : "border-muted-foreground hover:border-primary"
                        }`}
                      >
                        {event.is_completed && (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        )}
                      </button>
                      <div
                        className={`w-3 h-3 rounded-full mt-1.5 ${getCategoryColor(event.category)}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-medium text-foreground ${event.is_completed ? "line-through" : ""}`}>
                            {event.title}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.event_date), "h:mm a")}
                        </p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {event.description}
                          </p>
                        )}
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {event.category || "general"}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteEvent(event)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
