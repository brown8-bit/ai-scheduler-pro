import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CalendarInfo {
  id: string;
  name: string;
  primary?: boolean;
  selected: boolean;
}

interface CalendarSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectionId: string;
  onSave: () => void;
}

const CalendarSelectionModal = ({
  open,
  onOpenChange,
  connectionId,
  onSave,
}: CalendarSelectionModalProps) => {
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && connectionId) {
      fetchCalendars();
    }
  }, [open, connectionId]);

  const fetchCalendars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-calendar-sync", {
        body: { connectionId, action: "listCalendars" },
      });

      if (error) throw error;

      const calendarList = data?.calendars || [];
      setCalendars(
        calendarList.map((cal: { id: string; summary: string; primary?: boolean }) => ({
          id: cal.id,
          name: cal.summary,
          primary: cal.primary,
          selected: cal.primary || false,
        }))
      );
    } catch (error) {
      console.error("Error fetching calendars:", error);
      toast({
        title: "Error",
        description: "Failed to load calendars. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCalendar = (id: string) => {
    setCalendars((prev) =>
      prev.map((cal) => (cal.id === id ? { ...cal, selected: !cal.selected } : cal))
    );
  };

  const handleSave = async () => {
    const selectedCalendars = calendars.filter((c) => c.selected);
    if (selectedCalendars.length === 0) {
      toast({
        title: "Select at least one calendar",
        description: "Please select at least one calendar to sync.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Update connection settings with selected calendars
      const { error } = await supabase
        .from("calendar_connections")
        .update({
          calendar_ids: selectedCalendars.map((c) => c.id),
          settings: {
            calendars: selectedCalendars.map((c) => ({
              id: c.id,
              name: c.name,
              primary: c.primary,
            })),
          },
        })
        .eq("id", connectionId);

      if (error) throw error;

      toast({
        title: "Calendars saved!",
        description: `${selectedCalendars.length} calendar(s) will be synced.`,
      });

      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving calendars:", error);
      toast({
        title: "Error",
        description: "Failed to save calendar selection.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Select Calendars to Sync
          </DialogTitle>
          <DialogDescription>
            Choose which Google Calendars you want to sync with Schedulr.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : calendars.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No calendars found in your Google account.
            </p>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {calendars.map((calendar) => (
                <div
                  key={calendar.id}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <Checkbox
                    id={calendar.id}
                    checked={calendar.selected}
                    onCheckedChange={() => toggleCalendar(calendar.id)}
                  />
                  <Label
                    htmlFor={calendar.id}
                    className="flex-1 cursor-pointer flex items-center gap-2"
                  >
                    <span className="font-medium">{calendar.name}</span>
                    {calendar.primary && (
                      <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Selection"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarSelectionModal;
