import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Focus, Plus, Trash2, Clock, Calendar, Sun } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface FocusBlock {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  days_of_week: number[] | null;
  is_active: boolean | null;
}

interface DragState {
  blockId: string;
  type: "drag" | "resize-start" | "resize-end";
  initialX: number;
  initialStartTime: string;
  initialEndTime: string;
}

const DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const TIMELINE_HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM
const TIMELINE_START_HOUR = 6;
const TIMELINE_END_HOUR = 22;
const TOTAL_TIMELINE_MINUTES = (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;

const FocusBlocks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [focusBlocks, setFocusBlocks] = useState<FocusBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "Focus Time",
    start_time: "09:00",
    end_time: "11:00",
    days_of_week: [1, 2, 3, 4, 5],
  });
  
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [previewBlocks, setPreviewBlocks] = useState<Record<string, { start_time: string; end_time: string }>>({});
  const timelineRef = useRef<HTMLDivElement>(null);

  const today = new Date().getDay();
  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();

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
      fetchFocusBlocks();
    }
  }, [user]);

  const fetchFocusBlocks = async () => {
    const { data, error } = await supabase
      .from("focus_blocks")
      .select("*")
      .eq("user_id", user.id)
      .order("start_time", { ascending: true });

    if (!error && data) {
      setFocusBlocks(data);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    const { error } = await supabase.from("focus_blocks").insert({
      user_id: user.id,
      ...formData,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create focus block",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Focus Block Created! 🎯",
        description: "Your protected time is now scheduled",
      });
      setDialogOpen(false);
      setFormData({ title: "Focus Time", start_time: "09:00", end_time: "11:00", days_of_week: [1, 2, 3, 4, 5] });
      fetchFocusBlocks();
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("focus_blocks")
      .update({ is_active: isActive })
      .eq("id", id);

    if (!error) {
      fetchFocusBlocks();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("focus_blocks").delete().eq("id", id);

    if (!error) {
      toast({
        title: "Focus Block Deleted",
        description: "The focus block has been removed",
      });
      fetchFocusBlocks();
    }
  };

  const handleUpdateTime = async (id: string, startTime: string, endTime: string) => {
    const { error } = await supabase
      .from("focus_blocks")
      .update({ start_time: startTime, end_time: endTime })
      .eq("id", id);

    if (!error) {
      toast({
        title: "Focus Block Updated ✨",
        description: `${formatTime(startTime)} - ${formatTime(endTime)}`,
      });
      fetchFocusBlocks();
    }
  };

  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter((d) => d !== day)
        : [...prev.days_of_week, day].sort(),
    }));
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const formattedHour = h % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  const getDaysLabel = (days: number[] | null) => {
    if (!days || days.length === 0) return "No days";
    if (days.length === 7) return "Every day";
    if (JSON.stringify(days) === JSON.stringify([1, 2, 3, 4, 5])) return "Weekdays";
    if (JSON.stringify(days) === JSON.stringify([0, 6])) return "Weekends";
    return days.map((d) => DAYS.find((day) => day.value === d)?.label).join(", ");
  };

  const getTodayBlocks = () => {
    return focusBlocks.filter(
      (block) => block.is_active && block.days_of_week?.includes(today)
    );
  };

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const getBlockPosition = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = (hours - TIMELINE_START_HOUR) * 60 + minutes;
    return (totalMinutes / TOTAL_TIMELINE_MINUTES) * 100;
  };

  const getBlockWidth = (startTime: string, endTime: string) => {
    const startMinutes = timeToMinutes(startTime) - TIMELINE_START_HOUR * 60;
    const endMinutes = timeToMinutes(endTime) - TIMELINE_START_HOUR * 60;
    return ((endMinutes - startMinutes) / TOTAL_TIMELINE_MINUTES) * 100;
  };

  const getCurrentTimePosition = () => {
    if (currentHour < TIMELINE_START_HOUR || currentHour >= TIMELINE_END_HOUR) return null;
    const totalMinutes = (currentHour - TIMELINE_START_HOUR) * 60 + currentMinute;
    return (totalMinutes / TOTAL_TIMELINE_MINUTES) * 100;
  };

  const positionToMinutes = useCallback((clientX: number) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, relativeX / rect.width));
    const minutes = percentage * TOTAL_TIMELINE_MINUTES + TIMELINE_START_HOUR * 60;
    // Snap to 15-minute intervals
    return Math.round(minutes / 15) * 15;
  }, []);

  const handleDragStart = (e: React.MouseEvent, block: FocusBlock, type: DragState["type"]) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent text selection during drag
    document.body.style.userSelect = "none";
    document.body.style.cursor = type === "drag" ? "grabbing" : "ew-resize";
    
    setDragState({
      blockId: block.id,
      type,
      initialX: e.clientX,
      initialStartTime: block.start_time,
      initialEndTime: block.end_time,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState || !timelineRef.current) return;
    e.preventDefault();

    const currentMinutesAtMouse = positionToMinutes(e.clientX);
    const initialStartMinutes = timeToMinutes(dragState.initialStartTime);
    const initialEndMinutes = timeToMinutes(dragState.initialEndTime);
    const duration = initialEndMinutes - initialStartMinutes;

    let newStartMinutes = initialStartMinutes;
    let newEndMinutes = initialEndMinutes;

    if (dragState.type === "drag") {
      // Calculate offset from initial position
      const initialMinutesAtMouse = positionToMinutes(dragState.initialX);
      const deltaMinutes = currentMinutesAtMouse - initialMinutesAtMouse;
      
      newStartMinutes = Math.round((initialStartMinutes + deltaMinutes) / 15) * 15;
      newEndMinutes = newStartMinutes + duration;
      
      // Clamp to timeline bounds
      if (newStartMinutes < TIMELINE_START_HOUR * 60) {
        newStartMinutes = TIMELINE_START_HOUR * 60;
        newEndMinutes = newStartMinutes + duration;
      }
      if (newEndMinutes > TIMELINE_END_HOUR * 60) {
        newEndMinutes = TIMELINE_END_HOUR * 60;
        newStartMinutes = newEndMinutes - duration;
      }
    } else if (dragState.type === "resize-start") {
      newStartMinutes = Math.min(currentMinutesAtMouse, initialEndMinutes - 15);
      newStartMinutes = Math.max(newStartMinutes, TIMELINE_START_HOUR * 60);
    } else if (dragState.type === "resize-end") {
      newEndMinutes = Math.max(currentMinutesAtMouse, initialStartMinutes + 15);
      newEndMinutes = Math.min(newEndMinutes, TIMELINE_END_HOUR * 60);
    }

    setPreviewBlocks({
      [dragState.blockId]: {
        start_time: minutesToTime(newStartMinutes),
        end_time: minutesToTime(newEndMinutes),
      },
    });
  }, [dragState, positionToMinutes]);

  const handleMouseUp = useCallback(() => {
    // Reset cursor and selection
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    
    if (dragState && previewBlocks[dragState.blockId]) {
      const preview = previewBlocks[dragState.blockId];
      handleUpdateTime(dragState.blockId, preview.start_time, preview.end_time);
    }
    setDragState(null);
    setPreviewBlocks({});
  }, [dragState, previewBlocks]);

  useEffect(() => {
    if (dragState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  const todayBlocks = getTodayBlocks();
  const currentTimePosition = getCurrentTimePosition();

  const getDisplayTimes = (block: FocusBlock) => {
    if (previewBlocks[block.id]) {
      return previewBlocks[block.id];
    }
    return { start_time: block.start_time, end_time: block.end_time };
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Focus className="h-8 w-8 text-primary" />
              Focus Time Blocks
            </h1>
            <p className="text-muted-foreground mt-2">
              Protect your deep work time from interruptions 🧘
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Focus Block
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Focus Block</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Deep Work"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start">Start Time</Label>
                    <Input
                      id="start"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end">End Time</Label>
                    <Input
                      id="end"
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Days of Week</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DAYS.map((day) => (
                      <label
                        key={day.value}
                        className={`flex items-center justify-center w-12 h-10 rounded-md border cursor-pointer transition-colors ${
                          formData.days_of_week.includes(day.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-muted"
                        }`}
                      >
                        <Checkbox
                          checked={formData.days_of_week.includes(day.value)}
                          onCheckedChange={() => toggleDay(day.value)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={!formData.title}>
                  Create Focus Block
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Today's Timeline */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sun className="h-5 w-5 text-amber-500" />
              Today's Focus Schedule
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({DAYS[today].label}) — Drag to move, resize edges to adjust
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative pt-8">
              {/* Timeline background */}
              <div 
                ref={timelineRef}
                className={`h-20 bg-muted/30 rounded-lg relative border border-border ${dragState ? "cursor-grabbing" : ""}`}
                style={{ overflow: 'visible' }}
              >
                {/* Hour markers */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {TIMELINE_HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="flex-1 border-l border-border/50 first:border-l-0 relative"
                    >
                      <span className="absolute -bottom-6 left-0 transform -translate-x-1/2 text-xs text-muted-foreground">
                        {hour <= 12 ? `${hour}${hour < 12 ? 'a' : 'p'}` : `${hour - 12}p`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Focus blocks on timeline */}
                {todayBlocks.map((block, index) => {
                  const displayTimes = getDisplayTimes(block);
                  const left = getBlockPosition(displayTimes.start_time);
                  const width = getBlockWidth(displayTimes.start_time, displayTimes.end_time);
                  const isDragging = dragState?.blockId === block.id;
                  const colors = [
                    "bg-primary hover:bg-primary/90",
                    "bg-accent hover:bg-accent/90",
                    "bg-emerald-500 hover:bg-emerald-600",
                    "bg-violet-500 hover:bg-violet-600",
                    "bg-rose-500 hover:bg-rose-600",
                  ];
                  
                  return (
                    <div
                      key={block.id}
                      className={`absolute top-2 h-16 ${colors[index % colors.length]} rounded-md shadow-lg transition-all group select-none ${isDragging ? "ring-2 ring-white ring-offset-2 ring-offset-background z-50 scale-105" : "z-10 hover:shadow-xl"}`}
                      style={{
                        left: `${Math.max(0, left)}%`,
                        width: `${Math.min(width, 100 - left)}%`,
                        minWidth: "80px",
                      }}
                    >
                      {/* Time tooltip - always visible when dragging */}
                      {isDragging && (
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-foreground text-background px-3 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap shadow-lg z-50">
                          {formatTime(displayTimes.start_time)} - {formatTime(displayTimes.end_time)}
                        </div>
                      )}
                      
                      {/* Left resize handle */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center bg-black/0 hover:bg-black/20 rounded-l-md transition-colors z-20"
                        onMouseDown={(e) => handleDragStart(e, block, "resize-start")}
                      >
                        <div className="w-1 h-8 bg-white/40 group-hover:bg-white/70 rounded-full transition-colors" />
                      </div>
                      
                      {/* Draggable center area */}
                      <div
                        className="absolute left-4 right-4 top-0 bottom-0 flex items-center justify-center cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleDragStart(e, block, "drag")}
                      >
                        <span className="text-sm font-semibold text-white truncate drop-shadow-sm">
                          {block.title}
                        </span>
                      </div>
                      
                      {/* Right resize handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize flex items-center justify-center bg-black/0 hover:bg-black/20 rounded-r-md transition-colors z-20"
                        onMouseDown={(e) => handleDragStart(e, block, "resize-end")}
                      >
                        <div className="w-1 h-8 bg-white/40 group-hover:bg-white/70 rounded-full transition-colors" />
                      </div>
                    </div>
                  );
                })}

                {/* Current time indicator */}
                {currentTimePosition !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
                    style={{ left: `${currentTimePosition}%` }}
                  >
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  </div>
                )}

                {/* Empty state */}
                {todayBlocks.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-muted-foreground text-sm">No focus blocks scheduled for today</p>
                  </div>
                )}
              </div>
              
              {/* Hour labels space */}
              <div className="h-6" />
            </div>

            {/* Today's blocks summary */}
            {todayBlocks.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {todayBlocks.map((block, index) => {
                  const displayTimes = getDisplayTimes(block);
                  const colors = [
                    "bg-primary/20 text-primary border-primary/30",
                    "bg-accent/20 text-accent-foreground border-accent/30",
                    "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
                    "bg-violet-500/20 text-violet-700 dark:text-violet-400 border-violet-500/30",
                    "bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/30",
                  ];
                  return (
                    <div
                      key={block.id}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${colors[index % colors.length]}`}
                    >
                      {block.title}: {formatTime(displayTimes.start_time)} - {formatTime(displayTimes.end_time)}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Focus Blocks */}
        <h2 className="text-xl font-semibold mb-4 text-foreground">All Focus Blocks</h2>
        
        {focusBlocks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Focus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No focus blocks yet</h3>
              <p className="text-muted-foreground mb-4">
                Create focus blocks to protect your productive time!
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Focus Block
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {focusBlocks.map((block) => (
              <Card
                key={block.id}
                className={`transition-all ${block.is_active ? "hover:shadow-lg" : "opacity-60"}`}
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Focus className="h-5 w-5 text-primary" />
                      {block.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={block.is_active ?? true}
                      onCheckedChange={(checked) => handleToggle(block.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(block.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatTime(block.start_time)} - {formatTime(block.end_time)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{getDaysLabel(block.days_of_week)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default FocusBlocks;
