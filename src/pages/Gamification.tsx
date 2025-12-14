import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Target, Star, Award, Zap, Crown, Medal, Sparkles } from "lucide-react";

interface UserStreak {
  current_streak: number;
  longest_streak: number;
  total_events_completed: number;
  last_activity_date: string | null;
}

interface LeaderboardUser {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_events_completed: number;
  display_name: string | null;
  avatar_url: string | null;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: "crown" | "star" | "medal" | null;
  threshold: number;
  type: "streak" | "completed";
  unlocked: boolean;
}

const Gamification = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [streakData, setStreakData] = useState<UserStreak | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
    // Always fetch leaderboard for everyone
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (user) {
      fetchStreakData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStreakData = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error) {
      if (data) {
        setStreakData(data);
      } else {
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

  const fetchLeaderboard = async () => {
    // Fetch user streaks
    const { data: streaksData, error: streaksError } = await supabase
      .from("user_streaks")
      .select("user_id, current_streak, longest_streak, total_events_completed")
      .order("total_events_completed", { ascending: false })
      .limit(10);

    if (streaksError || !streaksData) return;

    // Fetch profiles for the users
    const userIds = streaksData.map(s => s.user_id);
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", userIds);

    // Merge the data
    const merged = streaksData.map(streak => {
      const profile = profilesData?.find(p => p.user_id === streak.user_id);
      return {
        ...streak,
        display_name: profile?.display_name || "Anonymous User",
        avatar_url: profile?.avatar_url || null,
      };
    });

    setLeaderboard(merged);
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
        badge: "star",
        threshold: 1,
        type: "completed",
        unlocked: totalCompleted >= 1,
      },
      {
        id: "streak_3",
        title: "On Fire",
        description: "Maintain a 3-day streak",
        icon: <Flame className="h-6 w-6" />,
        badge: "star",
        threshold: 3,
        type: "streak",
        unlocked: currentStreak >= 3,
      },
      {
        id: "streak_7",
        title: "Week Warrior",
        description: "Maintain a 7-day streak",
        icon: <Zap className="h-6 w-6" />,
        badge: "medal",
        threshold: 7,
        type: "streak",
        unlocked: currentStreak >= 7,
      },
      {
        id: "completed_10",
        title: "Productivity Pro",
        description: "Complete 10 events",
        icon: <Target className="h-6 w-6" />,
        badge: "medal",
        threshold: 10,
        type: "completed",
        unlocked: totalCompleted >= 10,
      },
      {
        id: "streak_30",
        title: "Month Master",
        description: "Maintain a 30-day streak",
        icon: <Trophy className="h-6 w-6" />,
        badge: "crown",
        threshold: 30,
        type: "streak",
        unlocked: currentStreak >= 30,
      },
      {
        id: "completed_50",
        title: "Task Champion",
        description: "Complete 50 events",
        icon: <Award className="h-6 w-6" />,
        badge: "crown",
        threshold: 50,
        type: "completed",
        unlocked: totalCompleted >= 50,
      },
      {
        id: "completed_100",
        title: "Legendary Achiever",
        description: "Complete 100 events",
        icon: <Crown className="h-6 w-6" />,
        badge: "crown",
        threshold: 100,
        type: "completed",
        unlocked: totalCompleted >= 100,
      },
    ];
  };

  const getBadgeIcon = (badge: "crown" | "star" | "medal" | null) => {
    switch (badge) {
      case "crown":
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case "star":
        return <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />;
      case "medal":
        return <Medal className="w-4 h-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getLeaderboardBadge = (position: number) => {
    switch (position) {
      case 0:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20">
            <Crown className="w-5 h-5 text-yellow-500" />
          </div>
        );
      case 1:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-400/20">
            <Medal className="w-5 h-5 text-gray-400" />
          </div>
        );
      case 2:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-600/20">
            <Medal className="w-5 h-5 text-amber-600" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
            <span className="text-sm font-medium text-muted-foreground">{position + 1}</span>
          </div>
        );
    }
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
  const userRank = leaderboard.findIndex(u => u.user_id === user?.id) + 1;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-8 pb-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Achievements & Leaderboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Track your progress, earn badges, and compete with others! 🏆
          </p>
        </div>

        <Tabs defaultValue={user ? "achievements" : "leaderboard"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="achievements" className="gap-2">
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Achievements</span>
              <span className="sm:hidden">Awards</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="space-y-6">
            {!user ? (
              <Card className="py-12">
                <CardContent className="text-center">
                  <Award className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sign in to track your achievements</h3>
                  <p className="text-muted-foreground mb-4">
                    Create an account to start earning badges and climbing the leaderboard!
                  </p>
                  <button
                    onClick={() => navigate("/register")}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Get Started
                  </button>
                </CardContent>
              </Card>
            ) : (
              <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Flame className="h-4 w-4 text-primary" />
                    Current Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl sm:text-4xl font-bold text-primary flex items-center gap-2">
                    {streakData?.current_streak || 0}
                    <span className="text-base sm:text-lg">days</span>
                    {(streakData?.current_streak || 0) >= 7 && (
                      <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    Longest Streak
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-2">
                    {streakData?.longest_streak || 0}
                    <span className="text-base sm:text-lg text-muted-foreground">days</span>
                    {(streakData?.longest_streak || 0) >= 30 && (
                      <Crown className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4 text-green-500" />
                    Events Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-2">
                    {streakData?.total_events_completed || 0}
                    {(streakData?.total_events_completed || 0) >= 50 && (
                      <Crown className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Progress to Next Milestone */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Progress to Next Milestone
                  </span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {streakData?.total_events_completed || 0} / {getNextMilestone()} events
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={getProgressToNextMilestone()} className="h-3" />
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  {getNextMilestone() - (streakData?.total_events_completed || 0)} more events to reach your next milestone! Keep going! 💪
                </p>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Achievements ({unlockedCount}/{achievements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all ${
                        achievement.unlocked
                          ? "bg-primary/10 border-primary/30 shadow-md"
                          : "bg-muted/30 border-border opacity-60"
                      }`}
                    >
                      {/* Badge indicator */}
                      {achievement.unlocked && achievement.badge && (
                        <div className="absolute -top-1 -right-1 animate-bounce">
                          {getBadgeIcon(achievement.badge)}
                        </div>
                      )}
                      <div
                        className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${
                          achievement.unlocked
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {achievement.icon}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm sm:text-base text-foreground flex items-center gap-1">
                          {achievement.title}
                          {achievement.unlocked && achievement.badge === "crown" && (
                            <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                          )}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-6">
            {/* Your Rank Card */}
            {userRank > 0 && (
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="py-4 sm:py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg sm:text-xl">
                        #{userRank}
                      </div>
                      <div>
                        <p className="text-sm sm:text-base font-medium">Your Rank</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {streakData?.total_events_completed || 0} events completed
                        </p>
                      </div>
                    </div>
                    {userRank === 1 && (
                      <Crown className="w-8 h-8 text-yellow-500 animate-pulse" />
                    )}
                    {userRank <= 3 && userRank > 1 && (
                      <Medal className="w-8 h-8 text-amber-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No data yet. Complete events to join the leaderboard!</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.user_id}
                        className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all ${
                          entry.user_id === user?.id
                            ? "bg-primary/10 border-primary/30"
                            : "bg-card border-border hover:bg-muted/50"
                        } ${index === 0 ? "ring-2 ring-yellow-500/30" : ""}`}
                      >
                        {getLeaderboardBadge(index)}
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                          <AvatarImage src={entry.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs sm:text-sm">
                            {entry.display_name?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <p className="font-medium text-sm sm:text-base truncate">
                              {entry.display_name || "Anonymous User"}
                            </p>
                            {entry.user_id === user?.id && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">You</span>
                            )}
                            {index === 0 && (
                              <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {entry.total_events_completed}
                            </span>
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3" />
                              {entry.current_streak}d
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg sm:text-xl font-bold text-primary">
                            {entry.total_events_completed}
                          </p>
                          <p className="text-xs text-muted-foreground">events</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Gamification;