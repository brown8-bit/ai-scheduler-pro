import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Target, Star, Award, Zap } from "lucide-react";

interface UserStreak {
  current_streak: number;
  longest_streak: number;
  total_events_completed: number;
  last_activity_date: string | null;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  threshold: number;
  type: "streak" | "completed";
  unlocked: boolean;
}

const Gamification = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [streakData, setStreakData] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchStreakData();
    }
  }, [user]);

  const fetchStreakData = async () => {
    const { data, error } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error) {
      if (data) {
        setStreakData(data);
      } else {
        // Create initial streak record
        const { data: newData } = await supabase
          .from("user_streaks")
          .insert({ user_id: user.id })
          .select()
          .single();
        setStreakData(newData);
      }
    }
    setLoading(false);
  };

  const getAchievements = (): Achievement[] => {
    const currentStreak = streakData?.current_streak || 0;
    const totalCompleted = streakData?.total_events_completed || 0;

    return [
      {
        id: "first_event",
        title: "First Step",
        description: "Complete your first event",
        icon: <Star className="h-6 w-6" />,
        threshold: 1,
        type: "completed",
        unlocked: totalCompleted >= 1,
      },
      {
        id: "streak_3",
        title: "On Fire",
        description: "Maintain a 3-day streak",
        icon: <Flame className="h-6 w-6" />,
        threshold: 3,
        type: "streak",
        unlocked: currentStreak >= 3,
      },
      {
        id: "streak_7",
        title: "Week Warrior",
        description: "Maintain a 7-day streak",
        icon: <Zap className="h-6 w-6" />,
        threshold: 7,
        type: "streak",
        unlocked: currentStreak >= 7,
      },
      {
        id: "completed_10",
        title: "Productivity Pro",
        description: "Complete 10 events",
        icon: <Target className="h-6 w-6" />,
        threshold: 10,
        type: "completed",
        unlocked: totalCompleted >= 10,
      },
      {
        id: "streak_30",
        title: "Month Master",
        description: "Maintain a 30-day streak",
        icon: <Trophy className="h-6 w-6" />,
        threshold: 30,
        type: "streak",
        unlocked: currentStreak >= 30,
      },
      {
        id: "completed_50",
        title: "Task Champion",
        description: "Complete 50 events",
        icon: <Award className="h-6 w-6" />,
        threshold: 50,
        type: "completed",
        unlocked: totalCompleted >= 50,
      },
    ];
  };

  const getNextMilestone = () => {
    const totalCompleted = streakData?.total_events_completed || 0;
    const milestones = [10, 25, 50, 100, 250, 500];
    return milestones.find((m) => m > totalCompleted) || milestones[milestones.length - 1];
  };

  const getProgressToNextMilestone = () => {
    const totalCompleted = streakData?.total_events_completed || 0;
    const nextMilestone = getNextMilestone();
    const previousMilestone = [0, 10, 25, 50, 100, 250].reverse().find((m) => m < nextMilestone) || 0;
    const progress = ((totalCompleted - previousMilestone) / (nextMilestone - previousMilestone)) * 100;
    return Math.min(progress, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const achievements = getAchievements();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Your Progress
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your productivity journey and unlock achievements! 🏆
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flame className="h-4 w-4 text-primary" />
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {streakData?.current_streak || 0}
                <span className="text-lg ml-1">days</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                Longest Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {streakData?.longest_streak || 0}
                <span className="text-lg ml-1 text-muted-foreground">days</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                Events Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">
                {streakData?.total_events_completed || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress to Next Milestone */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Progress to Next Milestone</span>
              <span className="text-sm font-normal text-muted-foreground">
                {streakData?.total_events_completed || 0} / {getNextMilestone()} events
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={getProgressToNextMilestone()} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {getNextMilestone() - (streakData?.total_events_completed || 0)} more events to reach your next milestone! Keep going! 💪
            </p>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Achievements ({unlockedCount}/{achievements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                    achievement.unlocked
                      ? "bg-primary/10 border-primary/30"
                      : "bg-muted/30 border-border opacity-60"
                  }`}
                >
                  <div
                    className={`p-3 rounded-full ${
                      achievement.unlocked
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {achievement.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Gamification;
