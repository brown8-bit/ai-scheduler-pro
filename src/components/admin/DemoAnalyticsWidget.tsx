import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  RotateCcw, 
  UserPlus, 
  TrendingUp, 
  BarChart3,
  Loader2 
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface DemoStats {
  totalResets: number;
  totalConversions: number;
  conversionRate: number;
  avgPromptsBeforeReset: number;
  dailyData: Array<{
    date: string;
    resets: number;
    conversions: number;
  }>;
}

const DemoAnalyticsWidget = () => {
  const [stats, setStats] = useState<DemoStats>({
    totalResets: 0,
    totalConversions: 0,
    conversionRate: 0,
    avgPromptsBeforeReset: 0,
    dailyData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDemoAnalytics();
  }, []);

  const fetchDemoAnalytics = async () => {
    try {
      // Fetch all demo analytics
      const { data, error } = await supabase
        .from("demo_analytics")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate metrics
      const resets = data.filter((d) => d.event_type === "demo_reset");
      const conversions = data.filter((d) => d.event_type === "demo_signup_conversion");

      const totalResets = resets.length;
      const totalConversions = conversions.length;

      // Get unique sessions that converted
      const convertedSessions = new Set(conversions.map((c) => c.session_id));
      const sessionsWithResets = new Set(resets.map((r) => r.session_id));
      
      // Conversion rate: conversions from users who also reset
      const sessionsWhoResetAndConverted = [...convertedSessions].filter((s) =>
        sessionsWithResets.has(s)
      ).length;
      
      const conversionRate = totalResets > 0 
        ? (sessionsWhoResetAndConverted / new Set([...sessionsWithResets]).size) * 100 
        : totalConversions > 0 ? 100 : 0;

      // Average prompts used before reset
      const avgPromptsBeforeReset = totalResets > 0
        ? resets.reduce((sum, r) => sum + (r.prompts_used || 0), 0) / totalResets
        : 0;

      // Group by date for chart
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split("T")[0];
      });

      const dailyData = last7Days.map((date) => {
        const dayResets = resets.filter(
          (r) => r.created_at.split("T")[0] === date
        ).length;
        const dayConversions = conversions.filter(
          (c) => c.created_at.split("T")[0] === date
        ).length;
        
        return {
          date: new Date(date).toLocaleDateString("en-US", { 
            month: "short", 
            day: "numeric" 
          }),
          resets: dayResets,
          conversions: dayConversions,
        };
      });

      setStats({
        totalResets,
        totalConversions,
        conversionRate,
        avgPromptsBeforeReset,
        dailyData,
      });
    } catch (error) {
      console.error("Error fetching demo analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="col-span-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const metricCards = [
    {
      label: "Demo Resets",
      value: stats.totalResets,
      icon: RotateCcw,
      color: "bg-orange-500/10 text-orange-500",
    },
    {
      label: "Signups from Demo",
      value: stats.totalConversions,
      icon: UserPlus,
      color: "bg-green-500/10 text-green-500",
    },
    {
      label: "Conversion Rate",
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      label: "Avg Prompts Before Reset",
      value: stats.avgPromptsBeforeReset.toFixed(1),
      icon: BarChart3,
      color: "bg-purple-500/10 text-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Demo Analytics
        </h2>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${metric.color} flex items-center justify-center mb-3`}>
                <metric.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold">{metric.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart - Trends */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">7-Day Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.dailyData}>
                  <defs>
                    <linearGradient id="colorResets" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="resets"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorResets)"
                    name="Resets"
                  />
                  <Area
                    type="monotone"
                    dataKey="conversions"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorConversions)"
                    name="Conversions"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Comparison */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Resets vs Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="resets" 
                    fill="hsl(var(--primary))" 
                    name="Resets"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="conversions" 
                    fill="#22c55e" 
                    name="Conversions"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {stats.totalResets === 0 && stats.totalConversions === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No demo analytics data yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Data will appear as guests use and reset the demo
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DemoAnalyticsWidget;
