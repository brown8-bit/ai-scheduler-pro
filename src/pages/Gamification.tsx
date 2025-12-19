import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Flame, Target, Star, Award, Zap, Crown, Medal, Sparkles } from "lucide-react";
import { useConfetti } from "@/hooks/useConfetti";

interface UserStreak {
  current_streak: number;
  longest_streak: number;
  total_events_completed: number;
  last_activity_date: string | null;
}

interface LeaderboardUser {
  rank_position: number;
  current_streak: number;
  total_events_completed: number;
  display_name: string;
  avatar_url: string | null;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge: "crown" | "star" | "medal" | "legendary" | null;
  threshold: number;
  type: "streak" | "completed" | "level";
  unlocked: boolean;
}

interface UserPoints {
  total_xp: number;
  current_level: number;
}

const MAX_LEVEL = 350;

const Gamification = () => {
  const navigate = useNavigate();
  const { fireAchievementConfetti } = useConfetti();
  const [user, setUser] = useState<any>(null);
  const [streakData, setStreakData] = useState<UserStreak | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [previousUnlockedCount, setPreviousUnlockedCount] = useState<number | null>(null);

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
      fetchLeaderboard();
      fetchUserPoints();
    }
  }, [user]);

  const fetchUserPoints = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_points")
      .select("total_xp, current_level")
      .eq("user_id", user.id)
      .single();
    
    if (data) {
      setUserPoints(data);
    }
  };

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
    // Use secure RPC function that returns anonymized leaderboard data
    const { data, error } = await supabase.rpc('get_leaderboard_data', {
      limit_count: 10
    });

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return;
    }

    setLeaderboard(data || []);
  };

  const getAchievements = (): Achievement[] => {
    const currentStreak = streakData?.current_streak || 0;
    const totalCompleted = streakData?.total_events_completed || 0;
    const currentLevel = userPoints?.current_level || 1;

    return [
      // Completion achievements
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
      // Streak achievements
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
        id: "streak_30",
        title: "Month Master",
        description: "Maintain a 30-day streak",
        icon: <Trophy className="h-6 w-6" />,
        badge: "crown",
        threshold: 30,
        type: "streak",
        unlocked: currentStreak >= 30,
      },
      // Level achievements
      {
        id: "level_10",
        title: "Rising Star",
        description: "Reach level 10",
        icon: <Star className="h-6 w-6" />,
        badge: "star",
        threshold: 10,
        type: "level",
        unlocked: currentLevel >= 10,
      },
      {
        id: "level_50",
        title: "Dedicated Learner",
        description: "Reach level 50",
        icon: <Zap className="h-6 w-6" />,
        badge: "medal",
        threshold: 50,
        type: "level",
        unlocked: currentLevel >= 50,
      },
      {
        id: "level_100",
        title: "Century Club",
        description: "Reach level 100",
        icon: <Award className="h-6 w-6" />,
        badge: "crown",
        threshold: 100,
        type: "level",
        unlocked: currentLevel >= 100,
      },
      {
        id: "level_200",
        title: "Elite Performer",
        description: "Reach level 200",
        icon: <Trophy className="h-6 w-6" />,
        badge: "crown",
        threshold: 200,
        type: "level",
        unlocked: currentLevel >= 200,
      },
      {
        id: "level_350",
        title: "Schedulr Legend",
        description: "Reach MAX level 350",
        icon: <Sparkles className="h-6 w-6" />,
        badge: "legendary",
        threshold: 350,
        type: "level",
        unlocked: currentLevel >= MAX_LEVEL,
      },
    ];
  };

  const getBadgeIcon = (badge: "crown" | "star" | "medal" | "legendary" | null) => {
    switch (badge) {
      case "legendary":
        return <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />;
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
  
  // Fire confetti when a new achievement is unlocked
  useEffect(() => {
    if (previousUnlockedCount !== null && unlockedCount > previousUnlockedCount) {
      fireAchievementConfetti();
    }
    setPreviousUnlockedCount(unlockedCount);
  }, [unlockedCount, previousUnlockedCount, fireAchievementConfetti]);
  
  // User rank is now based on their position relative to their total_events_completed
  const userRank = leaderboard.findIndex(u => u.total_events_completed <= (streakData?.total_events_completed || 0)) + 1 || leaderboard.length + 1;

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
            Earn XP, level up, and compete with other student-athletes! 🏆
          </p>
        </div>

        {/* XP and Level Overview */}
        {userPoints && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="text-3xl font-bold text-primary">
                    {userPoints.current_level}
                    {userPoints.current_level >= MAX_LEVEL && (
                      <Crown className="inline w-5 h-5 ml-1 text-yellow-500" />
                    )}
                  </p>
                  {userPoints.current_level >= MAX_LEVEL && (
                    <p className="text-xs text-yellow-500 font-semibold">MAX</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Total XP</p>
                  <p className="text-3xl font-bold">{userPoints.total_xp}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Next Level</p>
                  {userPoints.current_level >= MAX_LEVEL ? (
                    <p className="text-2xl font-bold text-yellow-500">MAX!</p>
                  ) : (
                    <p className="text-3xl font-bold">{100 - (userPoints.total_xp % 100)} XP</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Badges</p>
                  <p className="text-3xl font-bold">{unlockedCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="achievements" className="w-full">
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
                    {leaderboard.map((entry) => (
                      <div
                        key={entry.rank_position}
                        className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all bg-card border-border hover:bg-muted/50 ${entry.rank_position === 1 ? "ring-2 ring-yellow-500/30" : ""}`}
                      >
                        {getLeaderboardBadge(entry.rank_position - 1)}
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
                            {entry.rank_position === 1 && (
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