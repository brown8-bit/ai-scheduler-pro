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
  Gift
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ManageOffers from "@/components/admin/ManageOffers";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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

          {/* Manage Offers Section */}
          <ManageOffers />
        </div>
      </main>
    </div>
  );
};

export default Admin;
