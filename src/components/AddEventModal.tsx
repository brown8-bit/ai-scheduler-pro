import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Plus } from "lucide-react";
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
  DialogTrigger,
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

interface AddEventModalProps {
  userId: string;
  selectedDate?: Date;
  onEventAdded: () => void;
  trigger?: React.ReactNode;
}

const EVENT_CATEGORIES = [
  { value: "work", label: "Work", color: "bg-blue-500" },
  { value: "personal", label: "Personal", color: "bg-purple-500" },
  { value: "health", label: "Health", color: "bg-green-500" },
  { value: "social", label: "Social", color: "bg-pink-500" },
  { value: "general", label: "General", color: "bg-muted" },
];

const CONFIRMATION_PHRASES = [
  "Boom! Done! 💥",
  "Consider it scheduled! ✨",
  "You got it! 🎯",
  "Locked in! 🔒",
  "Easy peasy! 🌟",
  "Ta-da! 🎉",
  "All set! ✅",
  "Nailed it! 🚀",
];

const AddEventModal = ({ userId, selectedDate, onEventAdded, trigger }: AddEventModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date | undefined>(selectedDate || new Date());
  const [time, setTime] = useState("09:00");
  const [category, setCategory] = useState("general");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("weekly");
  const [reminder, setReminder] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate(selectedDate || new Date());
    setTime("09:00");
    setCategory("general");
    setIsRecurring(false);
    setRecurrencePattern("weekly");
    setReminder(false);
  };

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
      // Combine date and time
      const [hours, minutes] = time.split(":").map(Number);
      const eventDate = new Date(date);
      eventDate.setHours(hours, minutes, 0, 0);

      const { error } = await supabase.from("scheduled_events").insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        event_date: eventDate.toISOString(),
        category,
        is_recurring: isRecurring,
        recurrence_pattern: isRecurring ? recurrencePattern : null,
        reminder,
      });

      if (error) throw error;

      const randomPhrase = CONFIRMATION_PHRASES[Math.floor(Math.random() * CONFIRMATION_PHRASES.length)];
      
      toast({
        title: randomPhrase,
        description: `"${title}" scheduled for ${format(eventDate, "MMM d")} at ${format(eventDate, "h:mm a")}`,
      });

      resetForm();
      setOpen(false);
      onEventAdded();
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Oops!",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="hero" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Add New Event
          </DialogTitle>
          <DialogDescription>
            Schedule something new! Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM d, yyyy") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
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
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
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
              <Label htmlFor="recurring" className="cursor-pointer">Recurring Event</Label>
              <p className="text-xs text-muted-foreground">Repeat this event</p>
            </div>
            <Switch
              id="recurring"
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
              <Label htmlFor="reminder" className="cursor-pointer">Set Reminder</Label>
              <p className="text-xs text-muted-foreground">Get notified beforehand</p>
            </div>
            <Switch
              id="reminder"
              checked={reminder}
              onCheckedChange={setReminder}
            />
          </div>

          {/* Submit */}
          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Event"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventModal;
