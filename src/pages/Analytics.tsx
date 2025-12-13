import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Calendar, Clock, TrendingUp, PieChart } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";

interface EventStats {
  total: number;
  completed: number;
  byCategory: Record<string, number>;
  byMonth: Record<string, number>;
  avgPerWeek: number;
}

const Analytics = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [stats, setStats] = useState<EventStats>({
    total: 0,
    completed: 0,
    byCategory: {},
    byMonth: {},
    avgPerWeek: 0
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from("scheduled_events")
        .select("*");

      if (error) throw error;

      const events = data || [];
      
      // Calculate stats
      const byCategory: Record<string, number> = {};
      const byMonth: Record<string, number> = {};
      let completed = 0;

      events.forEach(event => {
        // By category
        const cat = event.category || 'general';
        byCategory[cat] = (byCategory[cat] || 0) + 1;

        // By month
        const month = new Date(event.event_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        byMonth[month] = (byMonth[month] || 0) + 1;

        // Completed
        if (event.is_completed) completed++;
      });

      // Calculate avg per week
      const weeks = events.length > 0 
        ? Math.ceil((Date.now() - new Date(events[events.length - 1].created_at).getTime()) / (7 * 24 * 60 * 60 * 1000))
        : 1;
      const avgPerWeek = Math.round((events.length / Math.max(weeks, 1)) * 10) / 10;

      setStats({
        total: events.length,
        completed,
        byCategory,
        byMonth,
        avgPerWeek
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      work: "bg-blue-500",
      personal: "bg-green-500",
      health: "bg-red-500",
      social: "bg-purple-500",
      general: "bg-gray-500"
    };
    return colors[category] || colors.general;
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <>
      <Helmet>
        <title>Analytics | Schedulr</title>
        <meta name="description" content="View your scheduling analytics and productivity insights." />
      </Helmet>

      <div className="min-h-screen bg-secondary/30">
        <Navbar />

        <main className="pt-24 pb-12 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-primary" />
                  Analytics
                </h1>
                <p className="text-muted-foreground mt-1">Your scheduling insights and patterns</p>
              </div>
              <Link to="/dashboard">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Events</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{completionRate}%</p>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{stats.avgPerWeek}</p>
                    <p className="text-sm text-muted-foreground">Avg/Week</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
                    <PieChart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-bold">{Object.keys(stats.byCategory).length}</p>
                    <p className="text-sm text-muted-foreground">Categories</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Events by Category */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-semibold mb-6">Events by Category</h2>
                {Object.keys(stats.byCategory).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No events yet</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(stats.byCategory)
                      .sort((a, b) => b[1] - a[1])
                      .map(([category, count]) => {
                        const percentage = Math.round((count / stats.total) * 100);
                        return (
                          <div key={category}>
                            <div className="flex justify-between mb-1">
                              <span className="capitalize font-medium">{category}</span>
                              <span className="text-muted-foreground">{count} ({percentage}%)</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-3">
                              <div 
                                className={`h-3 rounded-full ${getCategoryColor(category)}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Events by Month */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h2 className="text-xl font-semibold mb-6">Events by Month</h2>
                {Object.keys(stats.byMonth).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No events yet</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(stats.byMonth)
                      .slice(-6)
                      .map(([month, count]) => {
                        const maxCount = Math.max(...Object.values(stats.byMonth));
                        const percentage = Math.round((count / maxCount) * 100);
                        return (
                          <div key={month}>
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">{month}</span>
                              <span className="text-muted-foreground">{count} events</span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-3">
                              <div 
                                className="h-3 rounded-full gradient-primary"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* Insights */}
            <div className="mt-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-border p-6">
              <h2 className="text-xl font-semibold mb-4">💡 Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Most scheduled category</p>
                  <p className="font-semibold capitalize">
                    {Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])[0]?.[0] || "None yet"}
                  </p>
                </div>
                <div className="bg-card/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Busiest month</p>
                  <p className="font-semibold">
                    {Object.entries(stats.byMonth).sort((a, b) => b[1] - a[1])[0]?.[0] || "None yet"}
                  </p>
                </div>
                <div className="bg-card/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">Productivity score</p>
                  <p className="font-semibold">
                    {completionRate >= 80 ? "🔥 Excellent!" : completionRate >= 50 ? "👍 Good" : "📈 Room to grow"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Analytics;
