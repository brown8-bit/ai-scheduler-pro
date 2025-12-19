import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { useConfetti } from "@/hooks/useConfetti";
import {
  Droplet,
  Apple,
  Moon,
  Dumbbell,
  BookOpen,
  Clock,
  FileText,
  Brain,
  Heart,
  Coffee,
  Users,
  Sparkles,
  Check,
  Plus,
  Trophy,
  Flame,
  Target,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Habit {
  id: string;
  habit_type: string;
  habit_name: string;
  habit_icon: string;
  points_value: number;
  is_default: boolean;
}

interface HabitCompletion {
  habit_id: string;
  completed_date: string;
}

interface UserPoints {
  total_xp: number;
  current_level: number;
}

const DEFAULT_HABITS = {
  health: [
    { name: "Drink 8 glasses of water", icon: "droplet", points: 10 },
    { name: "Eat a healthy meal", icon: "apple", points: 15 },
    { name: "Get 8 hours sleep", icon: "moon", points: 20 },
    { name: "Exercise 30 minutes", icon: "dumbbell", points: 25 },
  ],
  academic: [
    { name: "Study for 2 hours", icon: "book", points: 20 },
    { name: "Attend all classes", icon: "clock", points: 15 },
    { name: "Complete homework", icon: "file", points: 15 },
    { name: "Review notes", icon: "brain", points: 10 },
  ],
  selfcare: [
    { name: "Take a break", icon: "coffee", points: 5 },
    { name: "Practice mindfulness", icon: "heart", points: 15 },
    { name: "Connect with friends", icon: "users", points: 10 },
    { name: "Do something fun", icon: "sparkles", points: 10 },
  ],
};

const iconMap: Record<string, React.ReactNode> = {
  droplet: <Droplet className="w-5 h-5" />,
  apple: <Apple className="w-5 h-5" />,
  moon: <Moon className="w-5 h-5" />,
  dumbbell: <Dumbbell className="w-5 h-5" />,
  book: <BookOpen className="w-5 h-5" />,
  clock: <Clock className="w-5 h-5" />,
  file: <FileText className="w-5 h-5" />,
  brain: <Brain className="w-5 h-5" />,
  coffee: <Coffee className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
  check: <Check className="w-5 h-5" />,
};

const DailyHabits = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fireLevelUpConfetti } = useConfetti();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    initializeHabits();
    fetchUserPoints();
  }, [user, navigate]);

  const initializeHabits = async () => {
    if (!user) return;

    // Fetch existing habits
    const { data: existingHabits } = await supabase
      .from("daily_habits")
      .select("*")
      .eq("user_id", user.id);

    if (!existingHabits || existingHabits.length === 0) {
      // Create default habits for new users
      const habitsToCreate: any[] = [];
      Object.entries(DEFAULT_HABITS).forEach(([type, habitList]) => {
        habitList.forEach((habit) => {
          habitsToCreate.push({
            user_id: user.id,
            habit_type: type,
            habit_name: habit.name,
            habit_icon: habit.icon,
            points_value: habit.points,
            is_default: true,
          });
        });
      });

      const { data: newHabits } = await supabase
        .from("daily_habits")
        .insert(habitsToCreate)
        .select();

      if (newHabits) {
        setHabits(newHabits);
      }
    } else {
      setHabits(existingHabits);
    }

    // Fetch today's completions
    const { data: todayCompletions } = await supabase
      .from("habit_completions")
      .select("habit_id, completed_date")
      .eq("user_id", user.id)
      .eq("completed_date", todayDate);

    setCompletions(todayCompletions || []);
    setLoading(false);
  };

  const fetchUserPoints = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("user_points")
      .select("total_xp, current_level")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setUserPoints(data);
    } else {
      // Initialize user points
      const { data: newPoints } = await supabase
        .from("user_points")
        .insert({ user_id: user.id, total_xp: 0, current_level: 1 })
        .select()
        .single();
      setUserPoints(newPoints);
    }
  };

  const toggleHabit = async (habit: Habit) => {
    if (!user) return;

    const isCompleted = completions.some((c) => c.habit_id === habit.id);

    if (isCompleted) {
      // Remove completion
      await supabase
        .from("habit_completions")
        .delete()
        .eq("user_id", user.id)
        .eq("habit_id", habit.id)
        .eq("completed_date", todayDate);

      setCompletions((prev) => prev.filter((c) => c.habit_id !== habit.id));
      
      toast({
        title: "Habit unmarked",
        description: `"${habit.habit_name}" removed from today's completions`,
      });
    } else {
      // Add completion and award XP
      await supabase.from("habit_completions").insert({
        user_id: user.id,
        habit_id: habit.id,
        completed_date: todayDate,
      });

      // Award XP
      const { data: xpResult } = await supabase.rpc("add_user_xp", {
        p_user_id: user.id,
        p_xp_amount: habit.points_value,
      });

      setCompletions((prev) => [
        ...prev,
        { habit_id: habit.id, completed_date: todayDate },
      ]);

      if (xpResult && typeof xpResult === 'object') {
        const result = xpResult as { total_xp: number; current_level: number; level_up: boolean };
        setUserPoints({
          total_xp: result.total_xp,
          current_level: result.current_level,
        });

        if (result.level_up) {
          fireLevelUpConfetti();
          toast({
            title: "🎉 Level Up!",
            description: `Congratulations! You reached Level ${result.current_level}!`,
          });
        } else {
          toast({
            title: "✅ Habit Complete!",
            description: `+${habit.points_value} XP earned!`,
          });
        }
      }
    }
  };

  const getHabitsByType = (type: string) =>
    habits.filter((h) => h.habit_type === type);

  const getCompletedCount = (type: string) =>
    getHabitsByType(type).filter((h) =>
      completions.some((c) => c.habit_id === h.id)
    ).length;

  const getTotalProgress = () => {
    if (habits.length === 0) return 0;
    return Math.round((completions.length / habits.length) * 100);
  };

  const getXPToNextLevel = () => {
    if (!userPoints) return 100;
    const xpInCurrentLevel = userPoints.total_xp % 100;
    return 100 - xpInCurrentLevel;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const categories = [
    {
      key: "health",
      label: "Health & Fitness",
      icon: <Dumbbell className="w-4 h-4" />,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      key: "academic",
      label: "Academic",
      icon: <BookOpen className="w-4 h-4" />,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      key: "selfcare",
      label: "Self-Care",
      icon: <Heart className="w-4 h-4" />,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-8 pb-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Daily Habits
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Track your daily basics and earn XP! 🎯
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Level</p>
                  <p className="text-3xl font-bold text-primary">
                    {userPoints?.current_level || 1}
                  </p>
                </div>
                <Trophy className="w-10 h-10 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total XP</p>
                  <p className="text-3xl font-bold text-foreground">
                    {userPoints?.total_xp || 0}
                  </p>
                </div>
                <Sparkles className="w-10 h-10 text-accent/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today's Progress</p>
                  <p className="text-3xl font-bold text-foreground">
                    {getTotalProgress()}%
                  </p>
                </div>
                <Flame className="w-10 h-10 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* XP Progress to Next Level */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">XP to Level {(userPoints?.current_level || 1) + 1}</span>
              <span className="text-sm text-muted-foreground">
                {100 - getXPToNextLevel()}/100 XP
              </span>
            </div>
            <Progress value={100 - getXPToNextLevel()} className="h-3" />
          </CardContent>
        </Card>

        {/* Habits by Category */}
        <Tabs defaultValue="health" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            {categories.map((cat) => (
              <TabsTrigger key={cat.key} value={cat.key} className="gap-2">
                {cat.icon}
                <span className="hidden sm:inline">{cat.label}</span>
                <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">
                  {getCompletedCount(cat.key)}/{getHabitsByType(cat.key).length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => (
            <TabsContent key={cat.key} value={cat.key}>
              <div className="grid gap-3">
                {getHabitsByType(cat.key).map((habit) => {
                  const isCompleted = completions.some(
                    (c) => c.habit_id === habit.id
                  );
                  return (
                    <Card
                      key={habit.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isCompleted
                          ? "bg-primary/10 border-primary/30"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => toggleHabit(habit)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                              isCompleted
                                ? "bg-primary text-primary-foreground"
                                : cat.bgColor + " " + cat.color
                            }`}
                          >
                            {isCompleted ? (
                              <Check className="w-6 h-6" />
                            ) : (
                              iconMap[habit.habit_icon] || (
                                <Check className="w-5 h-5" />
                              )
                            )}
                          </div>
                          <div className="flex-1">
                            <h3
                              className={`font-medium ${
                                isCompleted
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                            >
                              {habit.habit_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              +{habit.points_value} XP
                            </p>
                          </div>
                          {isCompleted && (
                            <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                              Done!
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Daily Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Today's Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {completions.length} / {habits.length}
                </p>
                <p className="text-sm text-muted-foreground">Habits completed</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  +
                  {completions.reduce((sum, c) => {
                    const habit = habits.find((h) => h.id === c.habit_id);
                    return sum + (habit?.points_value || 0);
                  }, 0)}
                </p>
                <p className="text-sm text-muted-foreground">XP earned today</p>
              </div>
            </div>
            <Progress value={getTotalProgress()} className="h-3 mt-4" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DailyHabits;