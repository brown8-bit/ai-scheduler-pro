import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp, Flame, Trophy, Zap, CalendarCheck } from "lucide-react";

interface UserStreak {
  current_streak: number;
  longest_streak: number;
  total_events_completed: number;
}

interface UserPoints {
  total_xp: number;
  current_level: number;
}

const Progress = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [streakData, setStreakData] = useState<UserStreak | null>(null);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;

    const [streakRes, pointsRes] = await Promise.all([
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

    if (streakRes.data) setStreakData(streakRes.data);
    if (pointsRes.data) setUserPoints(pointsRes.data);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-8 pb-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Progress Report
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Your streak, level, and wins over time.
          </p>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                  <p className="text-xs text-muted-foreground">Best Streak</p>
                  <p className="text-2xl font-bold">{streakData?.longest_streak || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total XP</p>
                  <p className="text-2xl font-bold">{userPoints?.total_xp || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/20">
                  <CalendarCheck className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tasks Completed</p>
                  <p className="text-2xl font-bold">{streakData?.total_events_completed || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Level</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Current level: <span className="font-semibold text-foreground">{userPoints?.current_level || 1}</span>
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Progress;