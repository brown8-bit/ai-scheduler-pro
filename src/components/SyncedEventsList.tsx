import { format, isSameDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Video, MapPin } from "lucide-react";

interface SyncedEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_all_day: boolean;
  location: string | null;
  is_busy: boolean;
}

interface SyncedEventsListProps {
  events: SyncedEvent[];
  selectedDate?: Date;
}

const SyncedEventsList = ({ events, selectedDate }: SyncedEventsListProps) => {
  const eventsForDate = selectedDate
    ? events.filter((event) => isSameDay(new Date(event.start_time), selectedDate))
    : events;

  if (eventsForDate.length === 0) {
    return null;
  }

  const hasGoogleMeetLink = (event: SyncedEvent): string | null => {
    if (event.location?.includes("meet.google.com")) {
      return event.location;
    }
    return null;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
        <div className="w-3 h-3 rounded-full bg-blue-500" />
        Google Calendar
      </div>
      {eventsForDate.map((event) => {
        const meetLink = hasGoogleMeetLink(event);
        
        return (
          <div
            key={event.id}
            className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:bg-blue-500/10 transition-colors"
          >
            <div className="w-1 h-full min-h-[40px] rounded-full bg-blue-500" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">{event.title}</h4>
                {meetLink && (
                  <a
                    href={meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    <Video className="w-3 h-3" />
                    Join
                  </a>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {event.is_all_day
                  ? "All day"
                  : `${format(new Date(event.start_time), "h:mm a")} - ${format(
                      new Date(event.end_time),
                      "h:mm a"
                    )}`}
              </p>
              {event.location && !meetLink && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </p>
              )}
            </div>
            <Badge variant="outline" className="text-xs border-blue-500/30 text-blue-600">
              <ExternalLink className="w-3 h-3 mr-1" />
              Google
            </Badge>
          </div>
        );
      })}
    </div>
  );
};

export default SyncedEventsList;
