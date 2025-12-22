import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isTomorrow, startOfWeek, endOfWeek } from "date-fns";
import { Calendar, CheckCircle, Clock, X } from "lucide-react";

interface ScheduledEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  reminder: boolean;
  category: string;
  is_completed: boolean;
}

type FilterType = "all" | "completed" | "thisWeek";

interface EventsListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFilter: FilterType;
}

const EventsListModal = ({ open, onOpenChange, initialFilter }: EventsListModalProps) => {
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>(initialFilter);

  useEffect(() => {
    if (open) {
      setFilter(initialFilter);
      fetchEvents();
    }
  }, [open, initialFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("scheduled_events")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEvents = () => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    switch (filter) {
      case "completed":
        return events.filter(e => e.is_completed);
      case "thisWeek":
        return events.filter(e => {
          const eventDate = new Date(e.event_date);
          return eventDate >= weekStart && eventDate <= weekEnd;
        });
      default:
        return events;
    }
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, "h:mm a")}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, "h:mm a")}`;
    } else {
      return format(date, "EEE, MMM d, yyyy 'at' h:mm a");
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

  const filteredEvents = getFilteredEvents();

  const getTitle = () => {
    switch (filter) {
      case "completed":
        return "Completed Events";
      case "thisWeek":
        return "This Week's Events";
      default:
        return "All Events";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all" className="gap-1.5 text-xs sm:text-sm">
              <Calendar className="w-3.5 h-3.5" />
              All
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5 text-xs sm:text-sm">
              <CheckCircle className="w-3.5 h-3.5" />
              Completed
            </TabsTrigger>
            <TabsTrigger value="thisWeek" className="gap-1.5 text-xs sm:text-sm">
              <Clock className="w-3.5 h-3.5" />
              This Week
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[50vh] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No events found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-4 rounded-lg border transition-all ${
                      event.is_completed 
                        ? "bg-muted/50 border-border" 
                        : "bg-card border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getCategoryColor(event.category)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`font-medium ${event.is_completed ? "line-through text-muted-foreground" : ""}`}>
                            {event.title}
                          </h3>
                          {event.is_completed && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Done
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs capitalize">
                            {event.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatEventTime(event.event_date)}
                        </p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventsListModal;
