import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  ArrowLeft,
  Save,
  Mail,
  CreditCard,
  Globe,
  Lock,
  Users,
  Loader2,
  LogOut,
  LayoutDashboard,
  History,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

const SETTINGS_KEYS = {
  appName: "app_name",
  supportEmail: "support_email",
  maintenanceMode: "maintenance_mode",
  allowSignups: "allow_signups",
  trialDays: "trial_days",
  monthlyPrice: "monthly_price",
  emailNotifications: "email_notifications",
  welcomeMessage: "welcome_message",
};

const SETTINGS_LABELS: Record<string, string> = {
  app_name: "App Name",
  support_email: "Support Email",
  maintenance_mode: "Maintenance Mode",
  allow_signups: "Allow Signups",
  trial_days: "Trial Days",
  monthly_price: "Monthly Price",
  email_notifications: "Email Notifications",
  welcome_message: "Welcome Message",
};

interface ChangelogEntry {
  id: string;
  setting_key: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
}

interface StoredSettings {
  [key: string]: string | undefined;
}

const AdminSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [storedSettings, setStoredSettings] = useState<StoredSettings>({});

  // App Settings State
  const [appName, setAppName] = useState("Schedulr");
  const [supportEmail, setSupportEmail] = useState("support@schedulr.app");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowSignups, setAllowSignups] = useState(true);
  const [trialDays, setTrialDays] = useState("7");
  const [monthlyPrice, setMonthlyPrice] = useState("29");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome to Schedulr!");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin-login");
        return;
      }

      const { data: hasAdminRole, error } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin"
      });

      if (error || !hasAdminRole) {
        navigate("/admin-login");
        return;
      }

      setIsAdmin(true);
      await Promise.all([loadSettings(), loadChangelog()]);
    } catch (error) {
      navigate("/admin-login");
    } finally {
      setLoading(false);
    }
  };

  const loadChangelog = async () => {
    const { data, error } = await supabase
      .from("admin_settings_changelog")
      .select("id, setting_key, old_value, new_value, changed_at")
      .order("changed_at", { ascending: false })
      .limit(20);

    if (!error && data) {
      setChangelog(data);
    }
  };

  const loadSettings = async () => {
    const { data: settings, error } = await supabase
      .from("admin_settings")
      .select("key, value");

    if (error) {
      console.error("Error loading settings:", error);
      return;
    }

    const stored: StoredSettings = {};
    if (settings) {
      settings.forEach((setting) => {
        stored[setting.key] = setting.value || undefined;
        switch (setting.key) {
          case SETTINGS_KEYS.appName:
            setAppName(setting.value || "Schedulr");
            break;
          case SETTINGS_KEYS.supportEmail:
            setSupportEmail(setting.value || "support@schedulr.app");
            break;
          case SETTINGS_KEYS.maintenanceMode:
            setMaintenanceMode(setting.value === "true");
            break;
          case SETTINGS_KEYS.allowSignups:
            setAllowSignups(setting.value !== "false");
            break;
          case SETTINGS_KEYS.trialDays:
            setTrialDays(setting.value || "7");
            break;
          case SETTINGS_KEYS.monthlyPrice:
            setMonthlyPrice(setting.value || "29");
            break;
          case SETTINGS_KEYS.emailNotifications:
            setEmailNotifications(setting.value !== "false");
            break;
          case SETTINGS_KEYS.welcomeMessage:
            setWelcomeMessage(setting.value || "Welcome to Schedulr!");
            break;
        }
      });
    }
    setStoredSettings(stored);
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const settingsToSave = [
        { key: SETTINGS_KEYS.appName, value: appName },
        { key: SETTINGS_KEYS.supportEmail, value: supportEmail },
        { key: SETTINGS_KEYS.maintenanceMode, value: String(maintenanceMode) },
        { key: SETTINGS_KEYS.allowSignups, value: String(allowSignups) },
        { key: SETTINGS_KEYS.trialDays, value: trialDays },
        { key: SETTINGS_KEYS.monthlyPrice, value: monthlyPrice },
        { key: SETTINGS_KEYS.emailNotifications, value: String(emailNotifications) },
        { key: SETTINGS_KEYS.welcomeMessage, value: welcomeMessage },
      ];

      // Track changes and save
      for (const setting of settingsToSave) {
        const oldValue = storedSettings[setting.key];
        
        // Only log if value changed
        if (oldValue !== setting.value) {
          // Insert changelog entry
          await supabase
            .from("admin_settings_changelog")
            .insert({
              setting_key: setting.key,
              old_value: oldValue || null,
              new_value: setting.value,
              changed_by: user.id,
            });
        }

        // Upsert the setting
        const { error } = await supabase
          .from("admin_settings")
          .upsert(
            { key: setting.key, value: setting.value },
            { onConflict: "key" }
          );

        if (error) throw error;
      }

      // Reload settings and changelog
      await Promise.all([loadSettings(), loadChangelog()]);

      toast({
        title: "Settings saved!",
        description: "Your app settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been logged out of the admin panel.",
    });
    navigate("/admin-login");
  };

  const formatValue = (value: string | null) => {
    if (value === null || value === undefined) return "Not set";
    if (value === "true") return "Enabled";
    if (value === "false") return "Disabled";
    if (value.length > 30) return value.substring(0, 30) + "...";
    return value;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/admin")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive flex items-center justify-center">
                <Settings className="w-5 h-5 text-destructive-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Admin Settings</h1>
                <p className="text-xs text-muted-foreground">App-wide configuration</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* View Toggle */}
            <div className="hidden sm:flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
              <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="view-toggle" className="text-sm text-muted-foreground cursor-pointer">
                User View
              </Label>
              <Switch 
                id="view-toggle" 
                onCheckedChange={(checked) => {
                  if (checked) navigate("/dashboard");
                }}
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">Save Changes</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-destructive gap-2"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* General Settings */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              General Settings
            </h2>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="appName">App Name</Label>
                <Input 
                  id="appName" 
                  value={appName} 
                  onChange={(e) => setAppName(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="welcomeMessage">Welcome Message</Label>
                <Textarea 
                  id="welcomeMessage" 
                  value={welcomeMessage} 
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Message shown to new users"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Disable access for all non-admin users</p>
                </div>
                <Switch 
                  checked={maintenanceMode} 
                  onCheckedChange={setMaintenanceMode} 
                />
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              User Management
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow New Signups</Label>
                  <p className="text-sm text-muted-foreground">Enable or disable new user registration</p>
                </div>
                <Switch 
                  checked={allowSignups} 
                  onCheckedChange={setAllowSignups} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trialDays">Trial Period (Days)</Label>
                <Input 
                  id="trialDays" 
                  type="number" 
                  value={trialDays} 
                  onChange={(e) => setTrialDays(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* Billing Settings */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Billing Settings
            </h2>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="monthlyPrice">Monthly Price ($)</Label>
                <Input 
                  id="monthlyPrice" 
                  type="number" 
                  value={monthlyPrice} 
                  onChange={(e) => setMonthlyPrice(e.target.value)} 
                />
              </div>
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Stripe integration is configured for payments.
                </p>
              </div>
            </div>
          </div>

          {/* Email Settings */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Email Settings
            </h2>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="supportEmail">Support Email</Label>
                <Input 
                  id="supportEmail" 
                  type="email" 
                  value={supportEmail} 
                  onChange={(e) => setSupportEmail(e.target.value)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send booking confirmations and reminders</p>
                </div>
                <Switch 
                  checked={emailNotifications} 
                  onCheckedChange={setEmailNotifications} 
                />
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Security
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Row Level Security enabled on all tables
                </p>
              </div>
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Admin role verification active
                </p>
              </div>
            </div>
          </div>

          {/* Settings Changelog */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Settings Changelog
            </h2>
            {changelog.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No changes recorded yet. Changes will appear here after you save settings.
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {changelog.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {SETTINGS_LABELS[entry.setting_key] || entry.setting_key}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="text-destructive/70">{formatValue(entry.old_value)}</span>
                        {" → "}
                        <span className="text-green-600 dark:text-green-400">{formatValue(entry.new_value)}</span>
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
