import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TimeSlotSuggestion {
  start: Date;
  end: Date;
  score: number;
  reason: string;
}

export interface SchedulingPreferences {
  preferredStartHour?: number;
  preferredEndHour?: number;
  preferMorning?: boolean;
  preferAfternoon?: boolean;
  avoidBackToBack?: boolean;
  minGapMinutes?: number;
}

const DEFAULT_PREFERENCES: SchedulingPreferences = {
  preferredStartHour: 9,
  preferredEndHour: 18,
  preferMorning: false,
  preferAfternoon: false,
  avoidBackToBack: true,
  minGapMinutes: 30,
};

export const useSmartScheduling = () => {
  const [finding, setFinding] = useState(false);

  const findBestTimeSlots = async (
    userId: string,
    targetDate: Date,
    durationMinutes: number = 60,
    preferences: SchedulingPreferences = {}
  ): Promise<TimeSlotSuggestion[]> => {
    setFinding(true);
    
    const prefs = { ...DEFAULT_PREFERENCES, ...preferences };
    
    try {
      // Get all events for the target day
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Fetch scheduled events
      const { data: scheduledEvents } = await supabase
        .from("scheduled_events")
        .select("id, title, event_date")
        .eq("user_id", userId)
        .gte("event_date", dayStart.toISOString())
        .lte("event_date", dayEnd.toISOString())
        .eq("is_completed", false);

      // Fetch synced events (Google Calendar)
      const { data: syncedEvents } = await supabase
        .from("synced_events")
        .select("id, title, start_time, end_time")
        .eq("user_id", userId)
        .gte("start_time", dayStart.toISOString())
        .lte("start_time", dayEnd.toISOString())
        .eq("is_busy", true);

      // Build busy slots array
      const busySlots: Array<{ start: Date; end: Date }> = [];
      
      if (scheduledEvents) {
        scheduledEvents.forEach(event => {
          const start = new Date(event.event_date);
          const end = new Date(start.getTime() + 60 * 60 * 1000); // Assume 1 hour
          busySlots.push({ start, end });
        });
      }

      if (syncedEvents) {
        syncedEvents.forEach(event => {
          busySlots.push({
            start: new Date(event.start_time),
            end: new Date(event.end_time)
          });
        });
      }

      // Sort busy slots by start time
      busySlots.sort((a, b) => a.start.getTime() - b.start.getTime());

      // Generate candidate time slots
      const suggestions: TimeSlotSuggestion[] = [];
      const now = new Date();
      
      // Working hours for the day
      const workStart = new Date(targetDate);
      workStart.setHours(prefs.preferredStartHour!, 0, 0, 0);
      const workEnd = new Date(targetDate);
      workEnd.setHours(prefs.preferredEndHour!, 0, 0, 0);

      // Check slots at 30-minute intervals
      const slotInterval = 30; // minutes
      let currentSlot = new Date(workStart);

      while (currentSlot.getTime() + durationMinutes * 60 * 1000 <= workEnd.getTime()) {
        const slotStart = new Date(currentSlot);
        const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

        // Skip if in the past
        if (slotStart < now) {
          currentSlot = new Date(currentSlot.getTime() + slotInterval * 60 * 1000);
          continue;
        }

        // Check if slot conflicts with any busy time
        const hasConflict = busySlots.some(busy => 
          slotStart < busy.end && slotEnd > busy.start
        );

        if (!hasConflict) {
          // Calculate score based on preferences
          let score = 100;
          const reasons: string[] = [];

          const hour = slotStart.getHours();

          // Prefer morning if set
          if (prefs.preferMorning && hour >= 9 && hour < 12) {
            score += 20;
            reasons.push("Morning slot");
          }

          // Prefer afternoon if set
          if (prefs.preferAfternoon && hour >= 13 && hour < 17) {
            score += 20;
            reasons.push("Afternoon slot");
          }

          // Check for back-to-back situations
          if (prefs.avoidBackToBack) {
            const minGap = (prefs.minGapMinutes || 30) * 60 * 1000;
            
            const tooCloseToEvent = busySlots.some(busy => {
              const gapBefore = slotStart.getTime() - busy.end.getTime();
              const gapAfter = busy.start.getTime() - slotEnd.getTime();
              return (gapBefore >= 0 && gapBefore < minGap) || 
                     (gapAfter >= 0 && gapAfter < minGap);
            });

            if (tooCloseToEvent) {
              score -= 30;
              reasons.push("Close to another event");
            } else if (busySlots.length > 0) {
              score += 15;
              reasons.push("Good buffer time");
            }
          }

          // Prefer mid-morning or mid-afternoon (golden hours)
          if ((hour >= 10 && hour <= 11) || (hour >= 14 && hour <= 15)) {
            score += 10;
            reasons.push("Optimal focus time");
          }

          // Slight preference for on-the-hour starts
          if (slotStart.getMinutes() === 0) {
            score += 5;
            reasons.push("Clean start time");
          }

          // Penalize very early or late slots
          if (hour < 9) {
            score -= 20;
            reasons.push("Early morning");
          }
          if (hour >= 17) {
            score -= 15;
            reasons.push("Late afternoon");
          }

          suggestions.push({
            start: slotStart,
            end: slotEnd,
            score,
            reason: reasons.length > 0 ? reasons[0] : "Available"
          });
        }

        currentSlot = new Date(currentSlot.getTime() + slotInterval * 60 * 1000);
      }

      // Sort by score (highest first) and return top 5
      suggestions.sort((a, b) => b.score - a.score);
      return suggestions.slice(0, 5);

    } catch (error) {
      console.error("Error finding time slots:", error);
      return [];
    } finally {
      setFinding(false);
    }
  };

  return {
    findBestTimeSlots,
    finding
  };
};
