import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Pencil, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
}

interface EditEventModalProps {
  event: ScheduledEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventUpdated: () => void;
}

const EVENT_CATEGORIES = [
  { value: "work", label: "Work", color: "bg-blue-500" },
  { value: "personal", label: "Personal", color: "bg-purple-500" },
  { value: "health", label: "Health", color: "bg-green-500" },
  { value: "social", label: "Social", color: "bg-pink-500" },
  { value: "general", label: "General", color: "bg-muted" },
];

const REMINDER_OPTIONS = [
  { value: "15", label: "15 minutes before" },
  { value: "30", label: "30 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "120", label: "2 hours before" },
  { value: "1440", label: "1 day before" },
];

const EditEventModal = ({ event, open, onOpenChange, onEventUpdated }: EditEventModalProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description || "");
  const [date, setDate] = useState<Date | undefined>(new Date(event.event_date));
  const [time, setTime] = useState(() => {
    const eventDate = new Date(event.event_date);
    return `${String(eventDate.getHours()).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}`;
  });
  const [category, setCategory] = useState(event.category || "general");
  const [isRecurring, setIsRecurring] = useState(event.is_recurring || false);
  const [recurrencePattern, setRecurrencePattern] = useState(event.recurrence_pattern || "weekly");
  const [reminder, setReminder] = useState(event.reminder || false);
  const [reminderMinutes, setReminderMinutes] = useState("60");

  // Reset form when event changes
  useEffect(() => {
    const eventDate = new Date(event.event_date);
    setTitle(event.title);
    setDescription(event.description || "");
    setDate(eventDate);
    setTime(`${String(eventDate.getHours()).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}`);
    setCategory(event.category || "general");
    setIsRecurring(event.is_recurring || false);
    setRecurrencePattern(event.recurrence_pattern || "weekly");
    setReminder(event.reminder || false);
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Oops!",
        description: "Please enter a title for your event.",
        variant: "destructive",
      });
      return;
    }

    if (!date) {
      toast({
        title: "Oops!",
        description: "Please select a date for your event.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Parse time and create date in local timezone
      const [hours, minutes] = time.split(":").map(Number);
      
      // Create a new date object preserving the selected date
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      
      // Create the event date with exact time - no timezone conversion issues
      const eventDate = new Date(year, month, day, hours, minutes, 0, 0);
      
      console.log("Saving event with date:", eventDate.toISOString());
      console.log("Local time:", eventDate.toLocaleString());

      const { error } = await supabase
        .from("scheduled_events")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          event_date: eventDate.toISOString(),
          category,
          is_recurring: isRecurring,
          recurrence_pattern: isRecurring ? recurrencePattern : null,
          reminder,
        })
        .eq("id", event.id);

      if (error) throw error;

      // Schedule notification reminder if enabled
      if (reminder) {
        await scheduleEventReminder(event.id, title, eventDate, parseInt(reminderMinutes));
      }

      toast({
        title: "Event updated! ✅",
        description: `"${title}" has been saved.`,
      });

      onOpenChange(false);
      onEventUpdated();
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Oops!",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const scheduleEventReminder = async (eventId: string, eventTitle: string, eventDate: Date, minutesBefore: number) => {
    try {
      // Get current user for email
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      // Calculate reminder time
      const reminderTime = new Date(eventDate.getTime() - minutesBefore * 60 * 1000);
      
      // Only schedule if reminder is in the future
      if (reminderTime > new Date()) {
        // Call edge function to schedule the reminder
        await supabase.functions.invoke('schedule-event-reminder', {
          body: {
            eventId,
            eventTitle,
            eventDate: eventDate.toISOString(),
            reminderTime: reminderTime.toISOString(),
            userEmail: user.email,
            minutesBefore,
          }
        });
      }
    } catch (error) {
      console.error("Error scheduling reminder:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Edit Event
          </DialogTitle>
          <DialogDescription>
            Update the details of your event.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-title">Event Title *</Label>
            <Input
              id="edit-title"
              placeholder="What are you scheduling?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className={cn(
                      "w-full justify-start text-left font-normal touch-manipulation",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start" side="bottom" avoidCollisions={true}>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => {
                      setDate(newDate);
                    }}
                    className="p-3 pointer-events-auto touch-manipulation"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-time">Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="edit-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", cat.color)} />
                      {cat.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (optional)</Label>
            <Textarea
              id="edit-description"
              placeholder="Add notes or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Recurring */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
            <div className="space-y-0.5">
              <Label htmlFor="edit-recurring" className="cursor-pointer">Recurring Event</Label>
              <p className="text-xs text-muted-foreground">Repeat this event</p>
            </div>
            <Switch
              id="edit-recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {isRecurring && (
            <div className="space-y-2 pl-3 border-l-2 border-primary/30">
              <Label>Repeat</Label>
              <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reminder */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
            <div className="space-y-0.5">
              <Label htmlFor="edit-reminder" className="cursor-pointer">Set Reminder</Label>
              <p className="text-xs text-muted-foreground">Get notified beforehand</p>
            </div>
            <Switch
              id="edit-reminder"
              checked={reminder}
              onCheckedChange={setReminder}
            />
          </div>

          {reminder && (
            <div className="space-y-2 pl-3 border-l-2 border-primary/30">
              <Label>Remind me</Label>
              <Select value={reminderMinutes} onValueChange={setReminderMinutes}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Submit */}
          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditEventModal;
