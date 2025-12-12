import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Users, 
  DollarSign, 
  Activity, 
  Calendar,
  TrendingUp,
  AlertCircle,
  Settings,
  LogOut,
  BarChart3
} from "lucide-react";

const Admin = () => {
  const stats = [
    { label: "Total Users", value: "2,847", change: "+12%", icon: Users },
    { label: "Revenue (MTD)", value: "$82,534", change: "+8%", icon: DollarSign },
    { label: "Active Sessions", value: "1,234", change: "+24%", icon: Activity },
    { label: "Events Created", value: "45,231", change: "+15%", icon: Calendar },
  ];

  const recentActivity = [
    { user: "john@email.com", action: "Signed up", time: "2 minutes ago" },
    { user: "sarah@email.com", action: "Upgraded to Pro", time: "15 minutes ago" },
    { user: "mike@email.com", action: "Created 5 events", time: "1 hour ago" },
    { user: "emma@email.com", action: "Canceled subscription", time: "2 hours ago" },
  ];

  return (
    <div className="min-h-screen bg-foreground">
      {/* Admin Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive flex items-center justify-center">
              <Shield className="w-5 h-5 text-destructive-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Schedulr Admin</h1>
              <p className="text-xs text-muted-foreground">Control Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-destructive">
                <LogOut className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl border border-border p-5 shadow-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-sm text-green-500 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.change}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Feed */}
            <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activity
              </h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="font-medium">{activity.user}</p>
                      <p className="text-sm text-muted-foreground">{activity.action}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Users className="w-4 h-4" />
                    Manage Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <DollarSign className="w-4 h-4" />
                    View Revenue
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Settings className="w-4 h-4" />
                    System Settings
                  </Button>
                </div>
              </div>

              {/* Alerts */}
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6">
                <h3 className="font-semibold flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-5 h-5" />
                  Attention Needed
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  3 failed payments require review.
                </p>
                <Button variant="outline" size="sm" className="mt-4 border-destructive/30 text-destructive hover:bg-destructive/10">
                  Review Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
