import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Target,
  Flame,
  Trophy,
  Calendar,
  Zap,
  Award,
} from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";

interface HabitCompletion {
  habit_id: string;
  completed_date: string;
  habit_type?: string;
}

interface DailyHabit {
  id: string;
  habit_type: string;
  habit_name: string;
  points_value: number;
}

interface UserStreak {
  current_streak: number;
  longest_streak: number;
  total_events_completed: number;
}

interface UserPoints {
  total_xp: number;
  current_level: number;
}

const COLORS = {
  health: "hsl(142, 76%, 36%)",
  academic: "hsl(217, 91%, 60%)",
  selfcare: "hsl(330, 81%, 60%)",
};

const Progress = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [habits, setHabits] = useState<DailyHabit[]>([]);
  const [streakData, setStreakData] = useState<UserStreak | null>(null);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month">("week");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchAllData();
  }, [user, navigate]);

  const fetchAllData = async () => {
    if (!user) return;

    const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

    const [habitsRes, completionsRes, streakRes, pointsRes] = await Promise.all([
      supabase.from("daily_habits").select("*").eq("user_id", user.id),
      supabase
        .from("habit_completions")
        .select("habit_id, completed_date")
        .eq("user_id", user.id)
        .gte("completed_date", thirtyDaysAgo),
      supabase
        .from("user_streaks")
        .select("current_streak, longest_streak, total_events_completed")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("user_points")
        .select("total_xp, current_level")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    if (habitsRes.data) setHabits(habitsRes.data);
    if (completionsRes.data) {
      // Map completions with habit types
      const enrichedCompletions = completionsRes.data.map((c) => {
        const habit = habitsRes.data?.find((h) => h.id === c.habit_id);
        return { ...c, habit_type: habit?.habit_type };
      });
      setCompletions(enrichedCompletions);
    }
    if (streakRes.data) setStreakData(streakRes.data);
    if (pointsRes.data) setUserPoints(pointsRes.data);

    setLoading(false);
  };

  const getDateRange = () => {
    const today = new Date();
    if (period === "week") {
      return eachDayOfInterval({
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 }),
      });
    } else {
      return eachDayOfInterval({
        start: startOfMonth(today),
        end: endOfMonth(today),
      });
    }
  };

  const getDailyCompletionData = () => {
    const dates = getDateRange();
    return dates.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayCompletions = completions.filter((c) => c.completed_date === dateStr);
      const healthCount = dayCompletions.filter((c) => c.habit_type === "health").length;
      const academicCount = dayCompletions.filter((c) => c.habit_type === "academic").length;
      const selfcareCount = dayCompletions.filter((c) => c.habit_type === "selfcare").length;

      return {
        date: format(date, period === "week" ? "EEE" : "MMM d"),
        health: healthCount,
        academic: academicCount,
        selfcare: selfcareCount,
        total: dayCompletions.length,
      };
    });
  };

  const getCategoryBreakdown = () => {
    const healthCount = completions.filter((c) => c.habit_type === "health").length;
    const academicCount = completions.filter((c) => c.habit_type === "academic").length;
    const selfcareCount = completions.filter((c) => c.habit_type === "selfcare").length;

    return [
      { name: "Health", value: healthCount, color: COLORS.health },
      { name: "Academic", value: academicCount, color: COLORS.academic },
      { name: "Self-Care", value: selfcareCount, color: COLORS.selfcare },
    ].filter((item) => item.value > 0);
  };

  const getCompletionRate = () => {
    const dates = getDateRange();
    const totalPossible = dates.length * habits.length;
    const totalCompleted = completions.filter((c) => {
      const date = new Date(c.completed_date);
      return date >= dates[0] && date <= dates[dates.length - 1];
    }).length;

    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  };

  const getXPEarned = () => {
    return completions.reduce((sum, c) => {
      const habit = habits.find((h) => h.id === c.habit_id);
      return sum + (habit?.points_value || 10);
    }, 0);
  };

  const getStreakTrend = () => {
    const dates = getDateRange();
    let currentStreak = 0;

    return dates.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayCompletions = completions.filter((c) => c.completed_date === dateStr);
      
      if (dayCompletions.length > 0) {
        currentStreak++;
      } else if (date < new Date()) {
        currentStreak = 0;
      }

      return {
        date: format(date, period === "week" ? "EEE" : "MMM d"),
        streak: currentStreak,
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const dailyData = getDailyCompletionData();
  const categoryData = getCategoryBreakdown();
  const streakTrend = getStreakTrend();
  const completionRate = getCompletionRate();
  const xpEarned = getXPEarned();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-8 pb-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Progress Report
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Track your habits, XP, and streaks over time 📊
          </p>
        </div>

        {/* Period Selector */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as "week" | "month")} className="mb-6">
          <TabsList>
            <TabsTrigger value="week" className="gap-2">
              <Calendar className="w-4 h-4" />
              This Week
            </TabsTrigger>
            <TabsTrigger value="month" className="gap-2">
              <Calendar className="w-4 h-4" />
              This Month
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completion</p>
                  <p className="text-2xl font-bold text-primary">{completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">XP Earned</p>
                  <p className="text-2xl font-bold">{xpEarned}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                  <p className="text-2xl font-bold">{streakData?.current_streak || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/20">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="text-2xl font-bold">{userPoints?.current_level || 1}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Habits Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Daily Habit Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="health" name="Health" fill={COLORS.health} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="academic" name="Academic" fill={COLORS.academic} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="selfcare" name="Self-Care" fill={COLORS.selfcare} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No data yet. Complete some habits to see your breakdown!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Streak Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                Streak Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={streakTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="streak"
                      name="Streak Days"
                      stroke="hsl(24, 95%, 60%)"
                      strokeWidth={3}
                      dot={{ fill: "hsl(24, 95%, 60%)", strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Period Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-foreground">{completions.length}</p>
                <p className="text-sm text-muted-foreground">Total Completions</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-foreground">{streakData?.longest_streak || 0}</p>
                <p className="text-sm text-muted-foreground">Best Streak</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-foreground">{userPoints?.total_xp || 0}</p>
                <p className="text-sm text-muted-foreground">Total XP</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-3xl font-bold text-foreground">{streakData?.total_events_completed || 0}</p>
                <p className="text-sm text-muted-foreground">All-Time Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Progress;