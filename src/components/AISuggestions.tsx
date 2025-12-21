import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Sparkles, 
  Clock, 
  Target, 
  Calendar,
  Check,
  X,
  ChevronRight,
  Zap,
  TrendingUp,
  ListTodo
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { toast } from "@/hooks/use-toast";
import { format, addDays, isToday, isTomorrow, startOfDay, endOfDay, differenceInMinutes } from "date-fns";

interface Suggestion {
  id: string;
  type: "gap" | "habit" | "insight" | "focus";
  title: string;
  description: string;
  icon: typeof Clock;
  action?: {
    label: string;
    onClick: () => void;
  };
  metadata?: {
    date?: Date;
    duration?: number;
    startTime?: string;
    endTime?: string;
  };
}

interface WeeklySummary {
  eventsCompleted: number;
  focusMinutes: number;
  streak: number;
}

export function AISuggestions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events: syncedEvents, isConnected, primaryConnection, createFocusBlock } = useGoogleCalendar();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      generateSuggestions();
      fetchWeeklySummary();
    }
  }, [user, syncedEvents]);

  const fetchWeeklySummary = async () => {
    if (!user) return;

    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data: completedEvents } = await supabase
        .from("scheduled_events")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .gte("event_date", startOfWeek.toISOString());

      const { data: pomodoroSessions } = await supabase
        .from("pomodoro_sessions")
        .select("duration_minutes")
        .eq("user_id", user.id)
        .gte("completed_at", startOfWeek.toISOString());

      const { data: streak } = await supabase
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .single();

      const focusMinutes =
        pomodoroSessions?.reduce((acc, s) => acc + (s.duration_minutes || 0), 0) || 0;

      setWeeklySummary({
        eventsCompleted: completedEvents?.length || 0,
        focusMinutes,
        streak: streak?.current_streak || 0,
      });
    } catch (error) {
      console.error("Error fetching weekly summary:", error);
    }
  };

  const generateSuggestions = async () => {
    if (!user) return;
    setLoading(true);

    const newSuggestions: Suggestion[] = [];

    try {
      // 1. Find schedule gaps for tomorrow
      const tomorrow = addDays(new Date(), 1);
      const gaps = findScheduleGaps(tomorrow);

      if (gaps.length > 0) {
        const largestGap = gaps.sort((a, b) => b.duration - a.duration)[0];
        if (largestGap.duration >= 60) {
          newSuggestions.push({
            id: `gap-${tomorrow.toISOString()}`,
            type: "gap",
            title: `${formatDuration(largestGap.duration)} gap ${isTomorrow(tomorrow) ? "tomorrow" : format(tomorrow, "EEEE")}`,
            description: `You have free time from ${largestGap.start} to ${largestGap.end}. Schedule focus time?`,
            icon: Clock,
            action: {
              label: "Schedule Focus Time",
              onClick: () => handleScheduleFocusTime(largestGap, tomorrow),
            },
            metadata: {
              date: tomorrow,
              duration: largestGap.duration,
              startTime: largestGap.start,
              endTime: largestGap.end,
            },
          });
        }
      }

      // 2. Productivity insights
      if (weeklySummary && weeklySummary.eventsCompleted >= 5) {
        newSuggestions.push({
          id: "productivity-insight",
          type: "insight",
          title: "You're on a roll! 🔥",
          description: `${weeklySummary.eventsCompleted} tasks completed this week. Keep the momentum going!`,
          icon: TrendingUp,
        });
      }

      // 4. Focus block suggestion if no calendar connected
      if (!isConnected) {
        newSuggestions.push({
          id: "connect-calendar",
          type: "focus",
          title: "Connect your calendar",
          description: "Sync Google Calendar to get smarter scheduling suggestions",
          icon: Calendar,
          action: {
            label: "Connect Now",
            onClick: () => navigate("/settings"),
          },
        });
      }

      // 5. Check if user hasn't had focus time recently
      const { data: recentFocus } = await supabase
        .from("pomodoro_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("completed_at", addDays(new Date(), -3).toISOString())
        .limit(1);

      if (!recentFocus || recentFocus.length === 0) {
        newSuggestions.push({
          id: "focus-reminder",
          type: "focus",
          title: "Time for deep work?",
          description: "You haven't had a focus session in 3 days. A 25-min Pomodoro might help!",
          icon: Target,
          action: {
            label: "Start Focus Timer",
            onClick: () => navigate("/timer"),
          },
        });
      }

      setSuggestions(newSuggestions.filter(s => !dismissedIds.has(s.id)));
    } catch (error) {
      console.error("Error generating suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  const findScheduleGaps = (date: Date): Array<{ start: string; end: string; duration: number }> => {
    const gaps: Array<{ start: string; end: string; duration: number }> = [];
    const dayStart = 9; // 9 AM
    const dayEnd = 18; // 6 PM

    // Get events for this date
    const dayEvents = syncedEvents
      .filter(event => {
        const eventDate = new Date(event.start_time);
        return eventDate.toDateString() === date.toDateString() && event.is_busy;
      })
      .map(event => ({
        start: new Date(event.start_time),
        end: new Date(event.end_time),
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    // Also get local scheduled events
    // For now, just use synced events

    let currentTime = new Date(date);
    currentTime.setHours(dayStart, 0, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(dayEnd, 0, 0, 0);

    for (const event of dayEvents) {
      if (event.start > currentTime) {
        const gapDuration = differenceInMinutes(event.start, currentTime);
        if (gapDuration >= 30) {
          gaps.push({
            start: format(currentTime, "h:mm a"),
            end: format(event.start, "h:mm a"),
            duration: gapDuration,
          });
        }
      }
      if (event.end > currentTime) {
        currentTime = new Date(event.end);
      }
    }

    // Check gap after last event
    if (currentTime < endTime) {
      const gapDuration = differenceInMinutes(endTime, currentTime);
      if (gapDuration >= 30) {
        gaps.push({
          start: format(currentTime, "h:mm a"),
          end: format(endTime, "h:mm a"),
          duration: gapDuration,
        });
      }
    }

    return gaps;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const handleScheduleFocusTime = async (gap: { start: string; end: string; duration: number }, date: Date) => {
    if (!primaryConnection) {
      navigate("/chat");
      return;
    }

    setAcceptingId(`gap-${date.toISOString()}`);

    try {
      // Parse the time and create focus block
      const parseTime = (timeStr: string, baseDate: Date): Date => {
        const [time, period] = timeStr.split(" ");
        const [hours, minutes] = time.split(":").map(Number);
        const adjustedHours = period === "PM" && hours !== 12 ? hours + 12 : (period === "AM" && hours === 12 ? 0 : hours);
        const result = new Date(baseDate);
        result.setHours(adjustedHours, minutes, 0, 0);
        return result;
      };

      const startTime = parseTime(gap.start, date);
      const endTime = parseTime(gap.end, date);

      // Limit to 2 hours max
      const maxDuration = 2 * 60 * 60 * 1000;
      const actualEnd = new Date(Math.min(startTime.getTime() + maxDuration, endTime.getTime()));

      await createFocusBlock(
        primaryConnection.id,
        startTime.toISOString(),
        actualEnd.toISOString(),
        "Focus Time"
      );

      toast({
        title: "Focus time scheduled! 🎯",
        description: `Blocked ${formatDuration(differenceInMinutes(actualEnd, startTime))} for deep work.`,
      });

      handleDismiss(`gap-${date.toISOString()}`);
    } catch (error) {
      console.error("Error scheduling focus time:", error);
      toast({
        title: "Error",
        description: "Failed to schedule focus time.",
        variant: "destructive",
      });
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]));
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };

  const handleAccept = async (suggestion: Suggestion) => {
    if (suggestion.action) {
      suggestion.action.onClick();
    }
  };

  if (loading || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Weekly Summary Card */}
      {weeklySummary && (
        <Card className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                Weekly Summary
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {weeklySummary.eventsCompleted} tasks done • {formatDuration(weeklySummary.focusMinutes)} focused
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => navigate("/analytics")}
            >
              Details
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </Card>
      )}

      {/* AI Suggestions */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 bg-secondary/50 border-b border-border flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI Suggestions</span>
        </div>
        <div className="divide-y divide-border">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="p-4 hover:bg-secondary/30 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  suggestion.type === "gap" ? "bg-blue-500/10 text-blue-500" :
                  suggestion.type === "habit" ? "bg-orange-500/10 text-orange-500" :
                  suggestion.type === "insight" ? "bg-green-500/10 text-green-500" :
                  "bg-primary/10 text-primary"
                }`}>
                  <suggestion.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{suggestion.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{suggestion.description}</p>
                </div>
              </div>
              
              {/* Accept/Decline Buttons */}
              <div className="flex items-center gap-2 mt-3 ml-12">
                {suggestion.action && (
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => handleAccept(suggestion)}
                    disabled={acceptingId === suggestion.id}
                  >
                    {acceptingId === suggestion.id ? (
                      <>
                        <div className="w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Working...
                      </>
                    ) : (
                      <>
                        <Check className="w-3 h-3" />
                        {suggestion.action.label}
                      </>
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs gap-1.5 text-muted-foreground"
                  onClick={() => handleDismiss(suggestion.id)}
                >
                  <X className="w-3 h-3" />
                  Dismiss
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
