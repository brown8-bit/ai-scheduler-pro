import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ConflictingEvent {
  id: string;
  title: string;
  event_date: string;
  source: "scheduled" | "synced";
}

export interface AlternativeSlot {
  start: Date;
  label: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: ConflictingEvent[];
  alternatives: AlternativeSlot[];
}

// Default event duration in minutes (for events without explicit end time)
const DEFAULT_EVENT_DURATION = 60;

export const useConflictDetection = () => {
  const [checking, setChecking] = useState(false);

  const findAlternativeSlots = (
    eventDate: Date,
    durationMinutes: number,
    busySlots: Array<{ start: Date; end: Date }>
  ): AlternativeSlot[] => {
    const alternatives: AlternativeSlot[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check slots before and after the requested time
    const checkOffsets = [-2, -1, 1, 2, 3]; // Hours offset from requested time
    
    for (const offset of checkOffsets) {
      const candidateStart = new Date(eventDate.getTime() + offset * 60 * 60 * 1000);
      const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60 * 1000);
      
      // Skip if in the past
      if (candidateStart < new Date()) continue;
      
      // Skip if outside reasonable hours (8am - 9pm)
      const hour = candidateStart.getHours();
      if (hour < 8 || hour >= 21) continue;
      
      // Check if this slot conflicts with any busy slot
      const hasConflict = busySlots.some(busy => 
        candidateStart < busy.end && candidateEnd > busy.start
      );
      
      if (!hasConflict) {
        const timeStr = candidateStart.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit'
        });
        const dayStr = candidateStart.toDateString() === eventDate.toDateString() 
          ? '' 
          : ` (${candidateStart.toLocaleDateString('en-US', { weekday: 'short' })})`;
        
        alternatives.push({
          start: candidateStart,
          label: `${timeStr}${dayStr}`
        });
      }
      
      // Limit to 4 alternatives
      if (alternatives.length >= 4) break;
    }
    
    return alternatives;
  };

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
      
      // Create wider time window for finding alternatives (same day, 6am to 10pm)
      const dayStart = new Date(eventStart);
      dayStart.setHours(6, 0, 0, 0);
      const dayEnd = new Date(eventStart);
      dayEnd.setHours(22, 0, 0, 0);
      
      const conflicts: ConflictingEvent[] = [];
      const busySlots: Array<{ start: Date; end: Date }> = [];

      // Check scheduled_events
      const { data: scheduledEvents, error: scheduledError } = await supabase
        .from("scheduled_events")
        .select("id, title, event_date")
        .eq("user_id", userId)
        .gte("event_date", dayStart.toISOString())
        .lte("event_date", dayEnd.toISOString())
        .eq("is_completed", false);

      if (scheduledError) {
        console.error("Error checking scheduled events:", scheduledError);
      } else if (scheduledEvents) {
        for (const event of scheduledEvents) {
          if (excludeEventId && event.id === excludeEventId) continue;
          
          const existingStart = new Date(event.event_date);
          const existingEnd = new Date(existingStart.getTime() + DEFAULT_EVENT_DURATION * 60 * 1000);
          
          busySlots.push({ start: existingStart, end: existingEnd });
          
          // Check for overlap with requested time
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
        .gte("start_time", dayStart.toISOString())
        .lte("start_time", dayEnd.toISOString())
        .eq("is_busy", true);

      if (syncedError) {
        console.error("Error checking synced events:", syncedError);
      } else if (syncedEvents) {
        for (const event of syncedEvents) {
          const existingStart = new Date(event.start_time);
          const existingEnd = new Date(event.end_time);
          
          busySlots.push({ start: existingStart, end: existingEnd });
          
          // Check for overlap with requested time
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

      // Find alternative slots if there are conflicts
      const alternatives = conflicts.length > 0 
        ? findAlternativeSlots(eventDate, durationMinutes, busySlots)
        : [];

      return {
        hasConflict: conflicts.length > 0,
        conflicts,
        alternatives
      };
    } catch (error) {
      console.error("Error in conflict detection:", error);
      return { hasConflict: false, conflicts: [], alternatives: [] };
    } finally {
      setChecking(false);
    }
  };

  return {
    checkForConflicts,
    checking
  };
};
