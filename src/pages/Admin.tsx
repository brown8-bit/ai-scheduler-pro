import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Users, 
  Settings,
  LogOut,
  Loader2,
  ArrowLeft,
  LayoutDashboard,
  Gift,
  Calendar,
  CheckCircle,
  Crown,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ManageOffers from "@/components/admin/ManageOffers";
import DemoAnalyticsWidget from "@/components/admin/DemoAnalyticsWidget";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Stats {
  totalUsers: number;
  lifetimeUsers: number;
  verifiedUsers: number;
  totalEvents: number;
  completedEvents: number;
  totalTasks: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    lifetimeUsers: 0,
    verifiedUsers: 0,
    totalEvents: 0,
    completedEvents: 0,
    totalTasks: 0,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    // Set up real-time subscription for profiles
    const channel = supabase
      .channel('admin-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scheduled_events' },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const fetchStats = async () => {
    // Fetch user stats
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("is_lifetime, is_verified");

    if (!profilesError && profiles) {
      const totalUsers = profiles.length;
      const lifetimeUsers = profiles.filter(p => p.is_lifetime).length;
      const verifiedUsers = profiles.filter(p => p.is_verified).length;

      // Fetch event stats
      const { count: totalEvents } = await supabase
        .from("scheduled_events")
        .select("*", { count: "exact", head: true });

      const { count: completedEvents } = await supabase
        .from("scheduled_events")
        .select("*", { count: "exact", head: true })
        .eq("is_completed", true);

      // Fetch task stats
      const { count: totalTasks } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true });

      setStats({
        totalUsers,
        lifetimeUsers,
        verifiedUsers,
        totalEvents: totalEvents || 0,
        completedEvents: completedEvents || 0,
        totalTasks: totalTasks || 0,
      });
    }
  };

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

      if (error) {
        console.error("Error checking admin role:", error);
        navigate("/admin-login");
        return;
      }

      if (!hasAdminRole) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/admin-login");
        return;
      }

      setIsAdmin(true);
      await fetchStats();
    } catch (error) {
      console.error("Admin access check failed:", error);
      navigate("/admin-login");
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const statCards = [
    { 
      label: "Total Users", 
      value: stats.totalUsers, 
      icon: Users, 
      color: "bg-blue-500/10 text-blue-500" 
    },
    { 
      label: "Lifetime Members", 
      value: stats.lifetimeUsers, 
      icon: Crown, 
      color: "bg-amber-500/10 text-amber-500" 
    },
    { 
      label: "Verified Users", 
      value: stats.verifiedUsers, 
      icon: CheckCircle, 
      color: "bg-green-500/10 text-green-500" 
    },
    { 
      label: "Total Events", 
      value: stats.totalEvents, 
      icon: Calendar, 
      color: "bg-purple-500/10 text-purple-500" 
    },
    { 
      label: "Completed Events", 
      value: stats.completedEvents, 
      icon: TrendingUp, 
      color: "bg-emerald-500/10 text-emerald-500" 
    },
    { 
      label: "Total Tasks", 
      value: stats.totalTasks, 
      icon: CheckCircle, 
      color: "bg-cyan-500/10 text-cyan-500" 
    },
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Admin Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive flex items-center justify-center">
                <Shield className="w-5 h-5 text-destructive-foreground" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Schedulr Admin</h1>
                <p className="text-xs text-muted-foreground">Control Panel</p>
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
                  if (checked) {
                    navigate("/dashboard");
                  }
                }}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin-settings")}>
              <Settings className="w-4 h-4" />
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
        <div className="max-w-7xl mx-auto">
          {/* Real-time Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {statCards.map((stat) => (
              <div 
                key={stat.label} 
                className="bg-card rounded-xl border border-border p-4 shadow-card"
              >
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Quick Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <button 
              onClick={() => navigate("/admin/users")}
              className="bg-card rounded-xl border border-border p-6 shadow-card hover:border-primary/50 hover:shadow-glow transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">User Management</h3>
              <p className="text-sm text-muted-foreground mt-1">
                View all users, manage roles and subscriptions
              </p>
            </button>

            <button 
              onClick={() => navigate("/admin-settings")}
              className="bg-card rounded-xl border border-border p-6 shadow-card hover:border-primary/50 hover:shadow-glow transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Settings</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Configure app settings, billing, and security
              </p>
            </button>

            <button 
              className="bg-card rounded-xl border border-border p-6 shadow-card hover:border-primary/50 hover:shadow-glow transition-all text-left group sm:col-span-2 lg:col-span-1"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">Limited Offers</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manage promotional offers and deals
              </p>
            </button>
          </div>

          {/* Demo Analytics Widget */}
          <div className="mb-8">
            <DemoAnalyticsWidget />
          </div>

          {/* Manage Offers Section */}
          <ManageOffers />
        </div>
      </main>
    </div>
  );
};

export default Admin;
