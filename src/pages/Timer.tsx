import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Timer as TimerIcon, 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Brain, 
  Zap,
  Volume2,
  VolumeX,
  Plus,
  Minus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type TimerMode = "focus" | "break" | "custom";

const Timer = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<TimerMode>("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [customMinutes, setCustomMinutes] = useState(25);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [totalMinutesToday, setTotalMinutesToday] = useState(0);
  const [sessionStartMinutes, setSessionStartMinutes] = useState(25);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const presets = [
    { label: "Focus", icon: Brain, minutes: 25, mode: "focus" as TimerMode, color: "bg-primary" },
    { label: "Short Break", icon: Coffee, minutes: 5, mode: "break" as TimerMode, color: "bg-green-500" },
    { label: "Long Break", icon: Zap, minutes: 15, mode: "break" as TimerMode, color: "bg-blue-500" },
  ];

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (user) {
      fetchTodaysSessions();
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    // Create audio element for notification
    audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJOqrJaDb3J+jaKvopuKf4WJiISAenp+gYaKjI2OjYuIhYJ/fHp4eHl7foCDhoiKi4yMi4qIhoR/fHp4d3d4eXt+gYSHiYuMjIyLiYeEgX57eXd3d3h6fH+ChYiKjIyMi4qIhYJ/fHp4d3d4eXt+gYSHiYuMjIyLiYeEgX57eXd3d3h6fH+ChYiKjIyMi4qIhYJ/fHp4d3d4eXt+gYSHiYuMjIyLiYeEgX57eXd3d3h6fH+ChYiKjIyMi4qIhYJ/fHp4d3d4eXt+gQ==");
  }, []);

  const fetchTodaysSessions = async () => {
    if (!user) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data } = await supabase
      .from("pomodoro_sessions")
      .select("duration_minutes")
      .eq("user_id", user.id)
      .gte("completed_at", today.toISOString());
    
    if (data) {
      setSessionsCompleted(data.length);
      setTotalMinutesToday(data.reduce((sum, s) => sum + s.duration_minutes, 0));
    }
  };

  const saveSession = async (durationMinutes: number, sessionType: string) => {
    if (!user) return;
    
    await supabase.from("pomodoro_sessions").insert({
      user_id: user.id,
      duration_minutes: durationMinutes,
      session_type: sessionType,
    });
    
    fetchTodaysSessions();
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    
    if (mode === "focus" || mode === "custom") {
      await saveSession(sessionStartMinutes, mode);
      toast({
        title: "Focus session complete! 🎉",
        description: `Great work! ${sessionStartMinutes} minutes logged.`,
      });
    } else {
      toast({
        title: "Break's over! ⏰",
        description: "Ready for another focus session?",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePresetSelect = (preset: typeof presets[0]) => {
    setMode(preset.mode);
    setTimeLeft(preset.minutes * 60);
    setCustomMinutes(preset.minutes);
    setSessionStartMinutes(preset.minutes);
    setIsRunning(false);
  };

  const handleCustomTime = () => {
    setMode("custom");
    setTimeLeft(customMinutes * 60);
    setSessionStartMinutes(customMinutes);
    setIsRunning(false);
  };

  const adjustCustomMinutes = (delta: number) => {
    const newValue = Math.max(1, Math.min(120, customMinutes + delta));
    setCustomMinutes(newValue);
    if (!isRunning) {
      setTimeLeft(newValue * 60);
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (mode === "custom") {
      setTimeLeft(customMinutes * 60);
    } else {
      const preset = presets.find(p => p.mode === mode);
      setTimeLeft((preset?.minutes || 25) * 60);
    }
  };

  const progress = mode === "custom" 
    ? ((customMinutes * 60 - timeLeft) / (customMinutes * 60)) * 100
    : mode === "focus"
      ? ((25 * 60 - timeLeft) / (25 * 60)) * 100
      : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  const getModeColor = () => {
    switch (mode) {
      case "focus": return "from-primary to-orange-400";
      case "break": return "from-green-500 to-emerald-400";
      case "custom": return "from-purple-500 to-pink-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-3 sm:px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2">
              <TimerIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              Focus Timer
            </h1>
            <p className="text-muted-foreground mt-2">
              Stay focused and productive with timed sessions ⏱️
            </p>
          </div>

          {/* Timer Display */}
          <Card className="mb-6 sm:mb-8 overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${getModeColor()}`} style={{ width: `${progress}%`, transition: "width 1s linear" }} />
            <CardContent className="p-4 sm:p-8">
              <div className="text-center">
                {/* Mode Label */}
                <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6 ${
                  mode === "focus" ? "bg-primary/10 text-primary" : 
                  mode === "break" ? "bg-green-500/10 text-green-600" : 
                  "bg-purple-500/10 text-purple-600"
                }`}>
                  {mode === "focus" && <Brain className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {mode === "break" && <Coffee className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {mode === "custom" && <TimerIcon className="w-3 h-3 sm:w-4 sm:h-4" />}
                  {mode === "focus" ? "Focus Mode" : mode === "break" ? "Break Time" : "Custom Timer"}
                </div>

                {/* Time Display */}
                <div className={`text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight bg-gradient-to-r ${getModeColor()} bg-clip-text text-transparent mb-6 sm:mb-8`}>
                  {formatTime(timeLeft)}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full"
                    onClick={resetTimer}
                  >
                    <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Button>
                  <Button
                    size="icon"
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r ${getModeColor()} hover:opacity-90 transition-opacity`}
                    onClick={toggleTimer}
                  >
                    {isRunning ? (
                      <Pause className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    ) : (
                      <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Presets */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant={mode === preset.mode && timeLeft === preset.minutes * 60 ? "default" : "outline"}
                className="h-auto py-3 sm:py-4 flex flex-col gap-1 sm:gap-2"
                onClick={() => handlePresetSelect(preset)}
              >
                <preset.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-medium text-xs sm:text-sm">{preset.label}</span>
                <span className="text-xs opacity-70">{preset.minutes} min</span>
              </Button>
            ))}
          </div>

          {/* Custom Timer */}
          <Card className="mb-6 sm:mb-8">
            <CardContent className="p-4 sm:p-6">
              <Label className="text-sm font-medium mb-3 sm:mb-4 block">Custom Duration</Label>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10"
                  onClick={() => adjustCustomMinutes(-5)}
                  disabled={customMinutes <= 5}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={customMinutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setCustomMinutes(Math.max(1, Math.min(120, val)));
                    }}
                    className="w-16 sm:w-20 text-center text-base sm:text-lg font-bold"
                    min={1}
                    max={120}
                  />
                  <span className="text-sm sm:text-base text-muted-foreground">min</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10"
                  onClick={() => adjustCustomMinutes(5)}
                  disabled={customMinutes >= 120}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button onClick={handleCustomTime} className="w-full sm:w-auto mt-2 sm:mt-0 sm:ml-2">
                  Set Timer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-primary">{sessionsCompleted}</p>
                <p className="text-sm text-muted-foreground mt-1">Sessions Today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-4xl font-bold text-green-500">{totalMinutesToday}</p>
                <p className="text-sm text-muted-foreground mt-1">Minutes Focused</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Timer;
