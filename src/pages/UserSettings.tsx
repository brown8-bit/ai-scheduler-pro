import { useEffect, useState, useRef, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Settings, 
  User,
  Bell,
  Calendar,
  Moon,
  Sun,
  Save,
  Loader2,
  ArrowLeft,
  Camera
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const UserSettings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User Settings State
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [emailReminders, setEmailReminders] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [defaultEventDuration, setDefaultEventDuration] = useState("30");
  const [workdayStart, setWorkdayStart] = useState("09:00");
  const [workdayEnd, setWorkdayEnd] = useState("17:00");
  const [soundNotifications, setSoundNotifications] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
    if (user) {
      setDisplayName(user.email?.split("@")[0] || "");
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (data) {
      setDisplayName(data.display_name || user.email?.split("@")[0] || "");
      setAvatarUrl(data.avatar_url);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Add cache buster to URL
      const avatarUrlWithCache = `${publicUrl}?t=${Date.now()}`;

      // Upsert profile with new avatar URL
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          avatar_url: avatarUrlWithCache,
          display_name: displayName,
        }, { onConflict: "user_id" });

      if (profileError) throw profileError;

      setAvatarUrl(avatarUrlWithCache);
      toast({
        title: "Avatar updated! 📸",
        description: "Your profile picture has been saved.",
      });
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast({
        title: "Settings saved! ✅",
        description: "Your preferences have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const isDarkMode = theme === "dark";

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
                {/* Avatar Upload */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20 cursor-pointer" onClick={handleAvatarClick}>
                      <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Profile Picture</p>
                    <p className="text-xs text-muted-foreground">Click to upload a new photo (max 2MB)</p>
                  </div>
                </div>

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
                {isDarkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                Appearance
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Use dark theme</p>
                </div>
                <Switch 
                  checked={isDarkMode} 
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
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
