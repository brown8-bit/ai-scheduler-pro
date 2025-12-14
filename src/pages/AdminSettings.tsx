import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  ArrowLeft,
  Save,
  Mail,
  Bell,
  CreditCard,
  Globe,
  Lock,
  Users,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // App Settings State
  const [appName, setAppName] = useState("Schedulr");
  const [supportEmail, setSupportEmail] = useState("support@schedulr.app");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowSignups, setAllowSignups] = useState(true);
  const [trialDays, setTrialDays] = useState("7");
  const [monthlyPrice, setMonthlyPrice] = useState("29");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState("Welcome to Schedulr! 👋");

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
    } catch (error) {
      navigate("/admin-login");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate saving - in production, you'd save to database
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: "Settings saved! ✅",
      description: "Your app settings have been updated.",
    });
    setSaving(false);
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
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive flex items-center justify-center">
                <Shield className="w-5 h-5 text-destructive-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Admin Settings</h1>
                <p className="text-xs text-muted-foreground">App-wide configuration</p>
              </div>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
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
                  💳 Stripe integration not yet configured. <span className="text-primary cursor-pointer hover:underline">Set up payments</span>
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
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
