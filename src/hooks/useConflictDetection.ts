import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ConflictingEvent {
  id: string;
  title: string;
  event_date: string;
  source: "scheduled" | "synced";
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: ConflictingEvent[];
}

// Default event duration in minutes (for events without explicit end time)
const DEFAULT_EVENT_DURATION = 60;

export const useConflictDetection = () => {
  const [checking, setChecking] = useState(false);

  const checkForConflicts = async (
    userId: string,
    eventDate: Date,
    durationMinutes: number = DEFAULT_EVENT_DURATION,
    excludeEventId?: string
  ): Promise<ConflictResult> => {
    setChecking(true);
    
    try {
      const eventStart = new Date(eventDate);
      const eventEnd = new Date(eventStart.getTime() + durationMinutes * 60 * 1000);
      
      // Create time window to check (2 hours before and after to catch overlaps)
      const windowStart = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000);
      const windowEnd = new Date(eventEnd.getTime() + 2 * 60 * 60 * 1000);
      
      const conflicts: ConflictingEvent[] = [];

      // Check scheduled_events
      const { data: scheduledEvents, error: scheduledError } = await supabase
        .from("scheduled_events")
        .select("id, title, event_date")
        .eq("user_id", userId)
        .gte("event_date", windowStart.toISOString())
        .lte("event_date", windowEnd.toISOString())
        .eq("is_completed", false);

      if (scheduledError) {
        console.error("Error checking scheduled events:", scheduledError);
      } else if (scheduledEvents) {
        for (const event of scheduledEvents) {
          // Skip the event being edited
          if (excludeEventId && event.id === excludeEventId) continue;
          
          const existingStart = new Date(event.event_date);
          const existingEnd = new Date(existingStart.getTime() + DEFAULT_EVENT_DURATION * 60 * 1000);
          
          // Check for overlap
          if (eventStart < existingEnd && eventEnd > existingStart) {
            conflicts.push({
              id: event.id,
              title: event.title,
              event_date: event.event_date,
              source: "scheduled"
            });
          }
        }
      }

      // Check synced_events (Google Calendar, etc.)
      const { data: syncedEvents, error: syncedError } = await supabase
        .from("synced_events")
        .select("id, title, start_time, end_time")
        .eq("user_id", userId)
        .gte("start_time", windowStart.toISOString())
        .lte("start_time", windowEnd.toISOString())
        .eq("is_busy", true);

      if (syncedError) {
        console.error("Error checking synced events:", syncedError);
      } else if (syncedEvents) {
        for (const event of syncedEvents) {
          const existingStart = new Date(event.start_time);
          const existingEnd = new Date(event.end_time);
          
          // Check for overlap
          if (eventStart < existingEnd && eventEnd > existingStart) {
            conflicts.push({
              id: event.id,
              title: event.title,
              event_date: event.start_time,
              source: "synced"
            });
          }
        }
      }

      return {
        hasConflict: conflicts.length > 0,
        conflicts
      };
    } catch (error) {
      console.error("Error in conflict detection:", error);
      return { hasConflict: false, conflicts: [] };
    } finally {
      setChecking(false);
    }
  };

  return {
    checkForConflicts,
    checking
  };
};
