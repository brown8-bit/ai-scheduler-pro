import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, Plus, Users, MessageCircle, AlertTriangle, Sparkles, Zap } from "lucide-react";
import { useConflictDetection, ConflictingEvent, AlternativeSlot } from "@/hooks/useConflictDetection";
import { useSmartScheduling, TimeSlotSuggestion } from "@/hooks/useSmartScheduling";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [shareToCommunity, setShareToCommunity] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictingEvent[]>([]);
  const [alternatives, setAlternatives] = useState<AlternativeSlot[]>([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<TimeSlotSuggestion[]>([]);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  
  const { checkForConflicts, checking } = useConflictDetection();
  const { findBestTimeSlots, finding } = useSmartScheduling();

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDate(selectedDate || new Date());
    setTime("09:00");
    setCategory("general");
    setIsRecurring(false);
    setRecurrencePattern("weekly");
    setReminder(false);
    setShareToCommunity(false);
    setConflicts([]);
    setAlternatives([]);
    setShowConflictWarning(false);
    setSmartSuggestions([]);
    setShowSmartSuggestions(false);
  };

  const selectAlternativeTime = (slot: AlternativeSlot) => {
    const newDate = new Date(slot.start);
    setDate(newDate);
    setTime(
      `${String(newDate.getHours()).padStart(2, '0')}:${String(newDate.getMinutes()).padStart(2, '0')}`
    );
    setShowConflictWarning(false);
    setConflicts([]);
    setAlternatives([]);
    toast({
      title: "Time updated!",
      description: `Changed to ${slot.label}`,
    });
  };

  const selectSmartSlot = (slot: TimeSlotSuggestion) => {
    const newDate = new Date(slot.start);
    setDate(newDate);
    setTime(
      `${String(newDate.getHours()).padStart(2, '0')}:${String(newDate.getMinutes()).padStart(2, '0')}`
    );
    setShowSmartSuggestions(false);
    setSmartSuggestions([]);
    toast({
      title: "Smart time selected!",
      description: `${format(slot.start, "h:mm a")} - ${slot.reason}`,
    });
  };

  const handleFindBestTime = async () => {
    if (!date) return;
    
    const suggestions = await findBestTimeSlots(userId, date);
    if (suggestions.length > 0) {
      setSmartSuggestions(suggestions);
      setShowSmartSuggestions(true);
    } else {
      toast({
        title: "No available slots",
        description: "Try selecting a different day or adjust your working hours.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent, forceCreate = false) => {
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

    // Combine date and time - preserve exact local time
    const [hours, minutes] = time.split(":").map(Number);
    
    // Create date with exact year, month, day, hour, minute to avoid timezone shifts
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const eventDate = new Date(year, month, day, hours, minutes, 0, 0);
    
    console.log("Creating event with local time:", eventDate.toLocaleString());
    console.log("ISO string being saved:", eventDate.toISOString());

    // Check for conflicts if not forcing creation
    if (!forceCreate) {
      const result = await checkForConflicts(userId, eventDate);
      if (result.hasConflict) {
        setConflicts(result.conflicts);
        setAlternatives(result.alternatives);
        setShowConflictWarning(true);
        return;
      }
    }

    setLoading(true);
    setShowConflictWarning(false);

    try {
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

      // Share to community if checkbox is checked
      if (shareToCommunity) {
        const categoryLabel = EVENT_CATEGORIES.find(c => c.value === category)?.label || "General";
        const scheduledDateStr = format(eventDate, "EEEE, MMMM d 'at' h:mm a");
        
        const communityContent = `📅 Scheduled preview – feedback welcome!\n\n**${title.trim()}**${description.trim() ? `\n\n${description.trim()}` : ""}\n\n🗓️ ${scheduledDateStr}\n📁 ${categoryLabel}${isRecurring ? `\n🔄 Repeats ${recurrencePattern}` : ""}\n\n#scheduled #${category} #productivity`;
        
        const { error: postError } = await supabase.from("social_posts").insert({
          user_id: userId,
          content: communityContent,
          post_type: "scheduled_preview",
        });

        if (postError) {
          console.error("Error sharing to community:", postError);
        }
      }

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

          {/* Smart Scheduling Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-2 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 hover:border-primary/40"
            onClick={handleFindBestTime}
            disabled={finding || !date}
          >
            {finding ? (
              <>
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Finding best times...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-primary" />
                Find best time for this day
              </>
            )}
          </Button>

          {/* Smart Suggestions */}
          {showSmartSuggestions && smartSuggestions.length > 0 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <Zap className="h-4 w-4" />
                <span className="font-medium text-sm">Best available times</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {smartSuggestions.map((slot, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={index === 0 ? "default" : "secondary"}
                    size="sm"
                    className={cn(
                      "flex flex-col items-start h-auto py-2 px-3",
                      index === 0 && "col-span-2 bg-gradient-to-r from-primary to-accent"
                    )}
                    onClick={() => selectSmartSlot(slot)}
                  >
                    <span className="font-medium">
                      {format(slot.start, "h:mm a")}
                    </span>
                    <span className={cn(
                      "text-xs",
                      index === 0 ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}>
                      {slot.reason}
                    </span>
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => setShowSmartSuggestions(false)}
              >
                Dismiss
              </Button>
            </div>
          )}

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

          {/* Share to Community */}
          <div className="flex items-start space-x-3 py-3 px-3 rounded-lg bg-primary/5 border border-primary/20">
            <Checkbox
              id="share-community"
              checked={shareToCommunity}
              onCheckedChange={(checked) => setShareToCommunity(checked === true)}
              className="mt-0.5"
            />
            <div className="flex-1 space-y-1">
              <Label htmlFor="share-community" className="cursor-pointer flex items-center gap-2 text-sm font-medium">
                <Users className="w-4 h-4 text-primary" />
                Share preview to Community
              </Label>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                Get feedback from fellow Schedulrs before it happens!
              </p>
            </div>
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

          {/* Conflict Warning */}
          {showConflictWarning && conflicts.length > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium text-sm">Scheduling Conflict</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This event overlaps with:
              </p>
              <ul className="text-xs space-y-1">
                {conflicts.map((conflict) => (
                  <li key={conflict.id} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    <span>
                      {conflict.title} at{" "}
                      {format(new Date(conflict.event_date), "h:mm a")}
                      {conflict.source === "synced" && (
                        <span className="text-muted-foreground ml-1">(calendar)</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Alternative Times */}
              {alternatives.length > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs font-medium text-foreground mb-2">
                    Available nearby times:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {alternatives.map((slot, index) => (
                      <Button
                        key={index}
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => selectAlternativeTime(slot)}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {slot.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowConflictWarning(false)}
                >
                  Edit Time
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Anyway"}
                </Button>
              </div>
            </div>
          )}

          {/* Submit */}
          {!showConflictWarning && (
            <Button type="submit" variant="hero" className="w-full" disabled={loading || checking}>
              {checking ? "Checking conflicts..." : loading ? "Creating..." : "Create Event"}
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEventModal;
