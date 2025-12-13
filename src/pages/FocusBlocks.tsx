import { useState, useEffect } from "react";
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
import { Focus, Plus, Trash2, Clock, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface FocusBlock {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  days_of_week: number[] | null;
  is_active: boolean | null;
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
