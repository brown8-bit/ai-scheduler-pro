import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isSameDay, addMonths, subMonths } from "date-fns";
import { CalendarDays, Clock, CheckCircle2, Plus, Trash2, Sparkles, AlertTriangle, Pencil } from "lucide-react";
import AddEventModal from "@/components/AddEventModal";
import EditEventModal from "@/components/EditEventModal";
import CalendarExport from "@/components/CalendarExport";
import SyncedEventsList from "@/components/SyncedEventsList";
import ScheddyLoader from "@/components/ScheddyLoader";
import { toast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { useKeyboardShortcutsContext } from "@/components/KeyboardShortcutsProvider";
import { useSyncedEvents } from "@/hooks/useSyncedEvents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Guest credits system (shared with AI chat)
const GUEST_CREDITS_KEY = "schedulr_guest_credits";
const INITIAL_GUEST_CREDITS = 350;

const getGuestCredits = (): number => {
  const stored = localStorage.getItem(GUEST_CREDITS_KEY);
  if (stored === null) {
    localStorage.setItem(GUEST_CREDITS_KEY, String(INITIAL_GUEST_CREDITS));
    return INITIAL_GUEST_CREDITS;
  }
  return parseInt(stored, 10);
};

const decrementGuestCredits = (): number => {
  const current = getGuestCredits();
  const newValue = Math.max(0, current - 1);
  localStorage.setItem(GUEST_CREDITS_KEY, String(newValue));
  return newValue;
};

interface ScheduledEvent {
  id: string;
  title: string;
  event_date: string;
  description: string | null;
  category: string | null;
  is_completed: boolean | null;
  is_recurring?: boolean | null;
  recurrence_pattern?: string | null;
  reminder?: boolean | null;
  hasConflict?: boolean;
}

// Simple add event component for guests
const GuestAddEventButton = ({ 
  selectedDate, 
  onAdd, 
  variant = "hero",
  size = "default"
}: { 
  selectedDate?: Date; 
  onAdd: (title: string, date: Date, category: string) => void;
  variant?: "hero" | "ghost" | "outline";
  size?: "default" | "sm";
}) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");

  const handleSubmit = () => {
    if (!title.trim() || !selectedDate) return;
    onAdd(title, selectedDate, category);
    setTitle("");
    setCategory("general");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="gap-1">
          <Plus className="h-4 w-4" />
          {size === "sm" ? "Add" : "Add Event"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Event Title</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="e.g., Team meeting"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="social">Social</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Date: {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
          </p>
          <Button onClick={handleSubmit} className="w-full" disabled={!title.trim()}>
            Add Event
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


const CalendarPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [guestEvents, setGuestEvents] = useState<ScheduledEvent[]>([]);
  const [guestCredits, setGuestCredits] = useState(() => getGuestCredits());
  const [loading, setLoading] = useState(true);
  const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const { scheduleEventReminder, isEnabled: notificationsEnabled, requestPermission } = useNotifications();
  const { setCalendarHandlers, setNewEventHandler } = useKeyboardShortcutsContext();
  const { syncedEvents, loading: syncedLoading, refetch: refetchSynced } = useSyncedEvents();

  // Keyboard shortcuts for calendar navigation
  const goToPreviousMonth = useCallback(() => {
    setCalendarMonth(prev => subMonths(prev, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCalendarMonth(prev => addMonths(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setSelectedDate(today);
    setCalendarMonth(today);
  }, []);

  const openNewEventModal = useCallback(() => {
    setAddEventOpen(true);
  }, []);

  // Register keyboard shortcut handlers
  useEffect(() => {
    setCalendarHandlers({
      onPrevious: goToPreviousMonth,
      onNext: goToNextMonth,
      onToday: goToToday,
    });
    setNewEventHandler(openNewEventModal);

    return () => {
      setCalendarHandlers({});
    };
  }, [setCalendarHandlers, setNewEventHandler, goToPreviousMonth, goToNextMonth, goToToday, openNewEventModal]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsGuest(true);
        setLoading(false);
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
      // Detect conflicts
      const eventsWithConflicts = detectConflicts(data);
      setEvents(eventsWithConflicts);
      
      // Schedule push notifications for events with reminders
      if (notificationsEnabled) {
        eventsWithConflicts.forEach((event) => {
          if (event.reminder && !event.is_completed) {
            const eventDate = new Date(event.event_date);
            if (eventDate > new Date()) {
              scheduleEventReminder(event.title, eventDate, 60); // 1 hour before
            }
          }
        });
      }
    }
    setLoading(false);
  };

  // Detect overlapping events (within 1 hour of each other)
  const detectConflicts = (eventList: ScheduledEvent[]): ScheduledEvent[] => {
    const DEFAULT_DURATION = 60 * 60 * 1000; // 1 hour in ms
    
    return eventList.map((event, index) => {
      const eventStart = new Date(event.event_date).getTime();
      const eventEnd = eventStart + DEFAULT_DURATION;
      
      // Check against all other events
      const hasConflict = eventList.some((other, otherIndex) => {
        if (index === otherIndex) return false;
        if (event.is_completed || other.is_completed) return false;
        
        const otherStart = new Date(other.event_date).getTime();
        const otherEnd = otherStart + DEFAULT_DURATION;
        
        // Check for overlap
        return eventStart < otherEnd && eventEnd > otherStart;
      });
      
      return { ...event, hasConflict };
    });
  };

  // Guest event management (local only)
  const addGuestEvent = (title: string, date: Date, category: string) => {
    if (guestCredits <= 0) {
      toast({
        title: "Credits exhausted",
        description: "Sign up for free to continue adding events!",
        variant: "destructive",
      });
      return;
    }

    const newEvent: ScheduledEvent = {
      id: `guest-${Date.now()}`,
      title,
      event_date: date.toISOString(),
      description: null,
      category,
      is_completed: false,
    };
    setGuestEvents(prev => [...prev, newEvent]);
    
    // Decrement credits
    const remaining = decrementGuestCredits();
    setGuestCredits(remaining);
    
    toast({
      title: "Event added! 🎉",
      description: `${remaining} credits remaining. Sign up to save events permanently.`,
    });
  };

  const handleToggleComplete = async (event: ScheduledEvent) => {
    if (isGuest) {
      setGuestEvents(prev => prev.map(e => 
        e.id === event.id ? { ...e, is_completed: !e.is_completed } : e
      ));
      toast({
        title: event.is_completed ? "Marked as incomplete" : "Nice work! ✅",
        description: event.is_completed 
          ? `"${event.title}" is back on your list.`
          : `"${event.title}" completed!`,
      });
      return;
    }

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
    if (isGuest) {
      setGuestEvents(prev => prev.filter(e => e.id !== event.id));
      toast({
        title: "Event removed",
        description: `"${event.title}" has been deleted.`,
      });
      return;
    }

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

  const activeEvents = isGuest ? guestEvents : events;
  const eventsForSelectedDate = activeEvents.filter((event) =>
    selectedDate && isSameDay(new Date(event.event_date), selectedDate)
  );
  const syncedEventsForSelectedDate = syncedEvents.filter((event) =>
    selectedDate && isSameDay(new Date(event.start_time), selectedDate)
  );

  const datesWithEvents = activeEvents.map((e) => new Date(e.event_date));
  const datesWithSyncedEvents = syncedEvents.map((e) => new Date(e.start_time));
  const allDatesWithEvents = [...datesWithEvents, ...datesWithSyncedEvents];
  
  // Get dates that have conflicts
  const datesWithConflicts = activeEvents
    .filter(e => e.hasConflict && !e.is_completed)
    .map(e => new Date(e.event_date));

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
        {/* Guest Banner */}
        {isGuest && (
          <div className={`mb-6 p-4 rounded-xl border ${guestCredits <= 50 ? "bg-amber-500/10 border-amber-500/30" : "bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20"}`}>
            <div className="flex items-center gap-3 flex-wrap justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${guestCredits <= 50 ? "bg-amber-500/20" : "bg-primary/20"}`}>
                  {guestCredits <= 50 ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {guestCredits <= 50 ? (
                      <span className="text-amber-600 dark:text-amber-400">⚠️ Only {guestCredits} credits left!</span>
                    ) : (
                      <>Try out the calendar! <span className="text-primary">({guestCredits} credits left)</span></>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {guestCredits <= 50 ? "Sign up now to save your events and get unlimited access." : "Events you add here won't be saved. Sign up to keep them."}
                  </p>
                </div>
              </div>
              <Link to="/register">
                <Button size="sm" variant="hero">Sign up free</Button>
              </Link>
            </div>
          </div>
        )}

        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Calendar View
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              {isGuest ? "Try adding events - sign up to save them! 📅" : "See all your scheduled events at a glance 📅"}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {!isGuest && <CalendarExport events={events} />}
            {user && (
              <AddEventModal 
                userId={user.id} 
                selectedDate={selectedDate}
                onEventAdded={fetchEvents}
                open={addEventOpen}
                onOpenChange={setAddEventOpen}
              />
            )}
            {isGuest && (
              <GuestAddEventButton 
                selectedDate={selectedDate} 
                onAdd={addGuestEvent} 
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
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                className="rounded-md border mx-auto pointer-events-auto"
                modifiers={{
                  hasEvent: allDatesWithEvents,
                  hasConflict: datesWithConflicts,
                }}
                modifiersStyles={{
                  hasEvent: {
                    backgroundColor: "hsl(var(--primary) / 0.2)",
                    borderRadius: "50%",
                  },
                  hasConflict: {
                    backgroundColor: "hsl(45 93% 47% / 0.3)",
                    borderRadius: "50%",
                    boxShadow: "inset 0 0 0 2px hsl(45 93% 47% / 0.6)",
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
              {selectedDate && user && (
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
              {selectedDate && isGuest && (
                <GuestAddEventButton 
                  selectedDate={selectedDate} 
                  onAdd={addGuestEvent}
                  variant="ghost"
                  size="sm"
                />
              )}
            </CardHeader>
            <CardContent>
              {eventsForSelectedDate.length === 0 && syncedEventsForSelectedDate.length === 0 ? (
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
                  {isGuest && (
                    <GuestAddEventButton 
                      selectedDate={selectedDate} 
                      onAdd={addGuestEvent}
                      variant="outline"
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Synced Events from Google Calendar */}
                  {syncedEventsForSelectedDate.length > 0 && (
                    <SyncedEventsList events={syncedEventsForSelectedDate} />
                  )}

                  {/* Conflict summary */}
                  {eventsForSelectedDate.some(e => e.hasConflict) && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium">
                        Some events overlap - consider rescheduling
                      </span>
                    </div>
                  )}
                  
                  {eventsForSelectedDate.map((event) => (
                    <div
                      key={event.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                        event.hasConflict && !event.is_completed
                          ? "bg-amber-500/5 border-amber-500/30 hover:bg-amber-500/10" 
                          : "bg-card hover:bg-muted/50"
                      } ${event.is_completed ? "opacity-60" : ""}`}
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
                          {event.hasConflict && !event.is_completed && (
                            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium">Conflict</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(event.event_date), "h:mm a")}
                        </p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1 truncate">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {event.category || "general"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isGuest && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => setEditingEvent(event)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteEvent(event)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Event Modal */}
        {editingEvent && (
          <EditEventModal
            event={editingEvent}
            open={!!editingEvent}
            onOpenChange={(open) => !open && setEditingEvent(null)}
            onEventUpdated={fetchEvents}
          />
        )}
      </main>
    </div>
  );
};

export default CalendarPage;
