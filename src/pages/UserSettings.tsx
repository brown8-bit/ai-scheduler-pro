import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  User,
  Bell,
  Calendar,
  Moon,
  Save,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const UserSettings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [saving, setSaving] = useState(false);

  // User Settings State
  const [displayName, setDisplayName] = useState("");
  const [emailReminders, setEmailReminders] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [defaultEventDuration, setDefaultEventDuration] = useState("30");
  const [workdayStart, setWorkdayStart] = useState("09:00");
  const [workdayEnd, setWorkdayEnd] = useState("17:00");
  const [darkMode, setDarkMode] = useState(false);
  const [soundNotifications, setSoundNotifications] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
    if (user) {
      setDisplayName(user.email?.split("@")[0] || "");
    }
  }, [user, authLoading, navigate]);

  const handleSave = async () => {
    setSaving(true);
    // Simulate saving - in production, you'd save to a user_settings table
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Settings saved! ✅",
      description: "Your preferences have been updated.",
    });
    setSaving(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Customize your experience</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Profile Settings */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile
              </h2>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Your name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input 
                    value={user.email || ""} 
                    disabled 
                    className="bg-secondary/50"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get notified before events</p>
                  </div>
                  <Switch 
                    checked={emailReminders} 
                    onCheckedChange={setEmailReminders} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Digest</Label>
                    <p className="text-sm text-muted-foreground">Receive a summary of your day each morning</p>
                  </div>
                  <Switch 
                    checked={dailyDigest} 
                    onCheckedChange={setDailyDigest} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sound Notifications</Label>
                    <p className="text-sm text-muted-foreground">Play sounds for alerts</p>
                  </div>
                  <Switch 
                    checked={soundNotifications} 
                    onCheckedChange={setSoundNotifications} 
                  />
                </div>
              </div>
            </div>

            {/* Calendar Preferences */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Calendar Preferences
              </h2>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="defaultDuration">Default Event Duration (minutes)</Label>
                  <Input 
                    id="defaultDuration" 
                    type="number" 
                    value={defaultEventDuration} 
                    onChange={(e) => setDefaultEventDuration(e.target.value)} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="workdayStart">Workday Start</Label>
                    <Input 
                      id="workdayStart" 
                      type="time" 
                      value={workdayStart} 
                      onChange={(e) => setWorkdayStart(e.target.value)} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="workdayEnd">Workday End</Label>
                    <Input 
                      id="workdayEnd" 
                      type="time" 
                      value={workdayEnd} 
                      onChange={(e) => setWorkdayEnd(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Moon className="w-5 h-5 text-primary" />
                Appearance
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Use dark theme</p>
                </div>
                <Switch 
                  checked={darkMode} 
                  onCheckedChange={setDarkMode} 
                />
              </div>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="w-full gap-2"
              size="lg"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserSettings;
