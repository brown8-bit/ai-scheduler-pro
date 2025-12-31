import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { format, subDays, startOfDay, addDays, getDay, differenceInDays } from "date-fns";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Flame } from "lucide-react";

interface DayData {
  date: Date;
  count: number;
  events: string[];
}

interface CalendarHeatmapProps {
  weeks?: number;
  className?: string;
}

export const CalendarHeatmap = ({ weeks = 15, className = "" }: CalendarHeatmapProps) => {
  const { user } = useAuth();
  const { isDemoMode, demoEvents } = useDemo();
  const [activityData, setActivityData] = useState<Map<string, DayData>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode) {
      generateDemoData();
    } else if (user) {
      fetchActivityData();
    }
  }, [user, isDemoMode, demoEvents]);

  const generateDemoData = () => {
    const data = new Map<string, DayData>();
    const today = startOfDay(new Date());
    const startDate = subDays(today, weeks * 7);

    // Use demo events
    demoEvents.forEach(event => {
      const eventDate = format(new Date(event.event_date), "yyyy-MM-dd");
      const existing = data.get(eventDate);
      if (existing) {
        existing.count += 1;
        existing.events.push(event.title);
      } else {
        data.set(eventDate, {
          date: new Date(event.event_date),
          count: 1,
          events: [event.title]
        });
      }
    });

    // Add some random activity for visual appeal
    for (let i = 0; i < weeks * 7; i++) {
      const date = addDays(startDate, i);
      const dateKey = format(date, "yyyy-MM-dd");
      if (!data.has(dateKey) && Math.random() > 0.6) {
        const count = Math.floor(Math.random() * 4) + 1;
        data.set(dateKey, {
          date,
          count,
          events: Array(count).fill("Sample event")
        });
      }
    }

    setActivityData(data);
    setLoading(false);
  };

  const fetchActivityData = async () => {
    if (!user) return;

    try {
      const today = startOfDay(new Date());
      const startDate = subDays(today, weeks * 7);

      const { data: events, error } = await supabase
        .from("scheduled_events")
        .select("event_date, title, is_completed")
        .eq("user_id", user.id)
        .gte("event_date", startDate.toISOString())
        .order("event_date");

      if (error) throw error;

      const data = new Map<string, DayData>();
      
      events?.forEach(event => {
        const eventDate = format(new Date(event.event_date), "yyyy-MM-dd");
        const existing = data.get(eventDate);
        if (existing) {
          existing.count += 1;
          existing.events.push(event.title);
        } else {
          data.set(eventDate, {
            date: new Date(event.event_date),
            count: 1,
            events: [event.title]
          });
        }
      });

      setActivityData(data);
    } catch (error) {
      console.error("Error fetching activity data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensity = (count: number): string => {
    if (count === 0) return "bg-muted/50";
    if (count === 1) return "bg-primary/20";
    if (count === 2) return "bg-primary/40";
    if (count === 3) return "bg-primary/60";
    if (count === 4) return "bg-primary/80";
    return "bg-primary";
  };

  const calendarGrid = useMemo(() => {
    const today = startOfDay(new Date());
    const totalDays = weeks * 7;
    const startDate = subDays(today, totalDays - 1);
    
    // Adjust start to beginning of week (Sunday)
    const dayOfWeek = getDay(startDate);
    const adjustedStart = subDays(startDate, dayOfWeek);
    
    const grid: (DayData | null)[][] = [];
    let currentDate = adjustedStart;
    
    // Calculate total weeks needed
    const daysUntilToday = differenceInDays(today, adjustedStart) + 1;
    const totalWeeks = Math.ceil(daysUntilToday / 7);
    
    for (let week = 0; week < totalWeeks; week++) {
      const weekDays: (DayData | null)[] = [];
      for (let day = 0; day < 7; day++) {
        if (currentDate > today) {
          weekDays.push(null);
        } else {
          const dateKey = format(currentDate, "yyyy-MM-dd");
          weekDays.push(activityData.get(dateKey) || { date: currentDate, count: 0, events: [] });
        }
        currentDate = addDays(currentDate, 1);
      }
      grid.push(weekDays);
    }
    
    return grid;
  }, [activityData, weeks]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; week: number }[] = [];
    const today = startOfDay(new Date());
    const startDate = subDays(today, weeks * 7 - 1);
    
    let lastMonth = -1;
    calendarGrid.forEach((week, weekIndex) => {
      const firstDayOfWeek = week.find(d => d !== null);
      if (firstDayOfWeek) {
        const month = firstDayOfWeek.date.getMonth();
        if (month !== lastMonth) {
          labels.push({ label: format(firstDayOfWeek.date, "MMM"), week: weekIndex });
          lastMonth = month;
        }
      }
    });
    
    return labels;
  }, [calendarGrid, weeks]);

  const totalActivity = useMemo(() => {
    let total = 0;
    activityData.forEach(day => {
      total += day.count;
    });
    return total;
  }, [activityData]);

  if (loading) {
    return (
      <div className={`bg-card rounded-xl border border-border p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-muted rounded mb-4"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`bg-card rounded-xl border border-border p-4 sm:p-5 shadow-card ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Activity</h3>
          </div>
          <span className="text-sm text-muted-foreground">
            {totalActivity} events in {weeks} weeks
          </span>
        </div>
        
        {/* Month labels */}
        <div className="flex mb-1 pl-8 text-xs text-muted-foreground">
          {monthLabels.map(({ label, week }, index) => (
            <span 
              key={index} 
              className="flex-shrink-0"
              style={{ 
                marginLeft: index === 0 ? `${week * 13}px` : undefined,
                width: index < monthLabels.length - 1 
                  ? `${(monthLabels[index + 1].week - week) * 13}px` 
                  : 'auto'
              }}
            >
              {label}
            </span>
          ))}
        </div>
        
        {/* Grid */}
        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 pr-2 text-xs text-muted-foreground justify-around">
            <span className="h-3 flex items-center">Mon</span>
            <span className="h-3 flex items-center">Wed</span>
            <span className="h-3 flex items-center">Fri</span>
          </div>
          
          {/* Calendar grid */}
          <div className="flex gap-0.5 overflow-x-auto scrollbar-hide">
            {calendarGrid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5">
                {week.map((day, dayIndex) => (
                  <Tooltip key={dayIndex}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-3 h-3 rounded-sm transition-colors ${
                          day === null 
                            ? "bg-transparent" 
                            : getIntensity(day.count)
                        } ${day && day.count > 0 ? "cursor-pointer hover:ring-2 hover:ring-primary/50" : ""}`}
                      />
                    </TooltipTrigger>
                    {day && (
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="text-sm">
                          <p className="font-medium">{format(day.date, "EEEE, MMM d")}</p>
                          {day.count > 0 ? (
                            <>
                              <p className="text-muted-foreground">{day.count} event{day.count > 1 ? "s" : ""}</p>
                              <ul className="mt-1 text-xs space-y-0.5">
                                {day.events.slice(0, 3).map((event, i) => (
                                  <li key={i} className="truncate">• {event}</li>
                                ))}
                                {day.events.length > 3 && (
                                  <li className="text-muted-foreground">+{day.events.length - 3} more</li>
                                )}
                              </ul>
                            </>
                          ) : (
                            <p className="text-muted-foreground">No events</p>
                          )}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm bg-muted/50" />
            <div className="w-3 h-3 rounded-sm bg-primary/20" />
            <div className="w-3 h-3 rounded-sm bg-primary/40" />
            <div className="w-3 h-3 rounded-sm bg-primary/60" />
            <div className="w-3 h-3 rounded-sm bg-primary" />
          </div>
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  );
};
