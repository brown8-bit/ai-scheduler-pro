import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

const DEMO_STORAGE_KEY = "schedulr_demo_data";
const DEMO_START_KEY = "schedulr_demo_start";
const DEMO_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export interface DemoEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  reminder: boolean;
  category: string;
  is_completed: boolean;
}

export interface DemoTask {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string | null;
  is_completed: boolean;
}

export interface DemoFocusBlock {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  days_of_week: number[];
  is_active: boolean;
}

export interface DemoStats {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  currentLevel: number;
  tasksCompleted: number;
  eventsCompleted: number;
  focusMinutesToday: number;
}

export interface DemoHabit {
  id: string;
  name: string;
  icon: string;
  completedToday: boolean;
  streak: number;
}

interface DemoData {
  events: DemoEvent[];
  tasks: DemoTask[];
  focusBlocks: DemoFocusBlock[];
  stats: DemoStats;
  habits: DemoHabit[];
  displayName: string;
}

interface DemoContextType {
  isDemoMode: boolean;
  demoTimeRemaining: number;
  demoEvents: DemoEvent[];
  demoTasks: DemoTask[];
  demoFocusBlocks: DemoFocusBlock[];
  demoStats: DemoStats;
  demoHabits: DemoHabit[];
  demoDisplayName: string;
  startDemo: () => void;
  endDemo: () => void;
  addDemoEvent: (event: Omit<DemoEvent, "id">) => void;
  updateDemoEvent: (id: string, updates: Partial<DemoEvent>) => void;
  deleteDemoEvent: (id: string) => void;
  addDemoTask: (task: Omit<DemoTask, "id">) => void;
  updateDemoTask: (id: string, updates: Partial<DemoTask>) => void;
  deleteDemoTask: (id: string) => void;
  addDemoFocusBlock: (block: Omit<DemoFocusBlock, "id">) => void;
  updateDemoFocusBlock: (id: string, updates: Partial<DemoFocusBlock>) => void;
  deleteDemoFocusBlock: (id: string) => void;
  completeDemoHabit: (id: string) => void;
  addDemoXP: (amount: number) => void;
  getDemoDataForConversion: () => DemoData;
  clearDemoData: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const DEFAULT_STATS: DemoStats = {
  currentStreak: 7,
  longestStreak: 14,
  totalXP: 1250,
  currentLevel: 5,
  tasksCompleted: 23,
  eventsCompleted: 45,
  focusMinutesToday: 120,
};

const generateSampleData = (): DemoData => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    displayName: "Demo Creator",
    stats: { ...DEFAULT_STATS },
    events: [
      {
        id: crypto.randomUUID(),
        title: "Morning Deep Work Block",
        description: "Focus time for content creation",
        event_date: new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString(),
        reminder: true,
        category: "work",
        is_completed: false,
      },
      {
        id: crypto.randomUUID(),
        title: "Team Standup Call",
        description: "Weekly sync with the team",
        event_date: new Date(tomorrow.getTime() + 10 * 60 * 60 * 1000).toISOString(),
        reminder: true,
        category: "work",
        is_completed: false,
      },
      {
        id: crypto.randomUUID(),
        title: "Gym Session",
        description: "Upper body workout",
        event_date: new Date(tomorrow.getTime() + 18 * 60 * 60 * 1000).toISOString(),
        reminder: true,
        category: "health",
        is_completed: false,
      },
      {
        id: crypto.randomUUID(),
        title: "Content Review Meeting",
        description: "Review weekly content calendar",
        event_date: new Date(today.getTime() + 14 * 60 * 60 * 1000).toISOString(),
        reminder: true,
        category: "work",
        is_completed: false,
      },
      {
        id: crypto.randomUUID(),
        title: "Podcast Recording",
        description: "Episode 12 - Guest interview",
        event_date: new Date(nextWeek.getTime() + 15 * 60 * 60 * 1000).toISOString(),
        reminder: true,
        category: "content",
        is_completed: false,
      },
    ],
    tasks: [
      {
        id: crypto.randomUUID(),
        title: "Finish blog post draft",
        description: "Complete the outline and first draft",
        due_date: tomorrow.toISOString().split("T")[0],
        priority: "high",
        is_completed: false,
      },
      {
        id: crypto.randomUUID(),
        title: "Review analytics dashboard",
        description: "Check weekly metrics and prepare report",
        due_date: nextWeek.toISOString().split("T")[0],
        priority: "medium",
        is_completed: false,
      },
      {
        id: crypto.randomUUID(),
        title: "Send invoice to client",
        description: "March project invoice",
        due_date: yesterday.toISOString().split("T")[0],
        priority: "high",
        is_completed: true,
      },
      {
        id: crypto.randomUUID(),
        title: "Edit YouTube video",
        description: "Add intro, transitions, and outro",
        due_date: today.toISOString().split("T")[0],
        priority: "high",
        is_completed: false,
      },
      {
        id: crypto.randomUUID(),
        title: "Schedule social media posts",
        description: "Queue up content for next week",
        due_date: tomorrow.toISOString().split("T")[0],
        priority: "medium",
        is_completed: false,
      },
      {
        id: crypto.randomUUID(),
        title: "Research new video topics",
        description: "Brainstorm 5 new content ideas",
        due_date: nextWeek.toISOString().split("T")[0],
        priority: "low",
        is_completed: false,
      },
    ],
    focusBlocks: [
      {
        id: crypto.randomUUID(),
        title: "Deep Work",
        start_time: "09:00",
        end_time: "11:30",
        days_of_week: [1, 2, 3, 4, 5],
        is_active: true,
      },
      {
        id: crypto.randomUUID(),
        title: "Content Creation",
        start_time: "14:00",
        end_time: "16:00",
        days_of_week: [1, 3, 5],
        is_active: true,
      },
      {
        id: crypto.randomUUID(),
        title: "Learning Block",
        start_time: "17:00",
        end_time: "18:00",
        days_of_week: [2, 4],
        is_active: true,
      },
    ],
    habits: [
      { id: crypto.randomUUID(), name: "Morning Meditation", icon: "🧘", completedToday: true, streak: 12 },
      { id: crypto.randomUUID(), name: "Read 30 mins", icon: "📚", completedToday: false, streak: 5 },
      { id: crypto.randomUUID(), name: "Exercise", icon: "💪", completedToday: true, streak: 7 },
      { id: crypto.randomUUID(), name: "Journal", icon: "✍️", completedToday: false, streak: 3 },
      { id: crypto.randomUUID(), name: "No Social Media", icon: "📵", completedToday: true, streak: 2 },
    ],
  };
};

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoTimeRemaining, setDemoTimeRemaining] = useState(0);
  const [demoEvents, setDemoEvents] = useState<DemoEvent[]>([]);
  const [demoTasks, setDemoTasks] = useState<DemoTask[]>([]);
  const [demoFocusBlocks, setDemoFocusBlocks] = useState<DemoFocusBlock[]>([]);
  const [demoStats, setDemoStats] = useState<DemoStats>(DEFAULT_STATS);
  const [demoHabits, setDemoHabits] = useState<DemoHabit[]>([]);
  const [demoDisplayName, setDemoDisplayName] = useState("Demo Creator");

  // Initialize from localStorage
  useEffect(() => {
    const startTime = localStorage.getItem(DEMO_START_KEY);
    if (startTime) {
      const elapsed = Date.now() - parseInt(startTime, 10);
      if (elapsed < DEMO_DURATION_MS) {
        setIsDemoMode(true);
        setDemoTimeRemaining(Math.floor((DEMO_DURATION_MS - elapsed) / 1000));
        
        const savedData = localStorage.getItem(DEMO_STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData) as DemoData;
          setDemoEvents(parsed.events || []);
          setDemoTasks(parsed.tasks || []);
          setDemoFocusBlocks(parsed.focusBlocks || []);
          setDemoStats(parsed.stats || DEFAULT_STATS);
          setDemoHabits(parsed.habits || []);
          setDemoDisplayName(parsed.displayName || "Demo Creator");
        }
      } else {
        localStorage.removeItem(DEMO_START_KEY);
        localStorage.removeItem(DEMO_STORAGE_KEY);
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!isDemoMode) return;

    const interval = setInterval(() => {
      setDemoTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          endDemo();
          toast({
            title: "Demo time expired ⏰",
            description: "Sign up to continue using Schedulr with all your data!",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isDemoMode]);

  // Persist demo data
  useEffect(() => {
    if (isDemoMode) {
      localStorage.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify({ 
          events: demoEvents, 
          tasks: demoTasks, 
          focusBlocks: demoFocusBlocks,
          stats: demoStats,
          habits: demoHabits,
          displayName: demoDisplayName,
        })
      );
    }
  }, [isDemoMode, demoEvents, demoTasks, demoFocusBlocks, demoStats, demoHabits, demoDisplayName]);

  const startDemo = useCallback(() => {
    const sampleData = generateSampleData();
    setDemoEvents(sampleData.events);
    setDemoTasks(sampleData.tasks);
    setDemoFocusBlocks(sampleData.focusBlocks);
    setDemoStats(sampleData.stats);
    setDemoHabits(sampleData.habits);
    setDemoDisplayName(sampleData.displayName);
    setIsDemoMode(true);
    setDemoTimeRemaining(DEMO_DURATION_MS / 1000);
    localStorage.setItem(DEMO_START_KEY, Date.now().toString());
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(sampleData));
    
    toast({
      title: "Welcome to Schedulr! 🎉",
      description: "Explore everything free for 30 minutes. Your progress saves if you sign up!",
    });
  }, []);

  const endDemo = useCallback(() => {
    setIsDemoMode(false);
    setDemoTimeRemaining(0);
    localStorage.removeItem(DEMO_START_KEY);
  }, []);

  const clearDemoData = useCallback(() => {
    setDemoEvents([]);
    setDemoTasks([]);
    setDemoFocusBlocks([]);
    setDemoStats(DEFAULT_STATS);
    setDemoHabits([]);
    localStorage.removeItem(DEMO_STORAGE_KEY);
    localStorage.removeItem(DEMO_START_KEY);
  }, []);

  const addDemoEvent = useCallback((event: Omit<DemoEvent, "id">) => {
    const newEvent: DemoEvent = { ...event, id: crypto.randomUUID() };
    setDemoEvents((prev) => [...prev, newEvent]);
    setDemoStats((prev) => ({ ...prev, totalXP: prev.totalXP + 5 }));
  }, []);

  const updateDemoEvent = useCallback((id: string, updates: Partial<DemoEvent>) => {
    setDemoEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    if (updates.is_completed) {
      setDemoStats((prev) => ({ 
        ...prev, 
        eventsCompleted: prev.eventsCompleted + 1,
        totalXP: prev.totalXP + 10,
      }));
    }
  }, []);

  const deleteDemoEvent = useCallback((id: string) => {
    setDemoEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addDemoTask = useCallback((task: Omit<DemoTask, "id">) => {
    const newTask: DemoTask = { ...task, id: crypto.randomUUID() };
    setDemoTasks((prev) => [...prev, newTask]);
    setDemoStats((prev) => ({ ...prev, totalXP: prev.totalXP + 5 }));
  }, []);

  const updateDemoTask = useCallback((id: string, updates: Partial<DemoTask>) => {
    setDemoTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
    if (updates.is_completed) {
      setDemoStats((prev) => ({ 
        ...prev, 
        tasksCompleted: prev.tasksCompleted + 1,
        totalXP: prev.totalXP + 15,
      }));
      toast({
        title: "Task completed! +15 XP 🎯",
        description: "Keep up the great work!",
      });
    }
  }, []);

  const deleteDemoTask = useCallback((id: string) => {
    setDemoTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addDemoFocusBlock = useCallback((block: Omit<DemoFocusBlock, "id">) => {
    const newBlock: DemoFocusBlock = { ...block, id: crypto.randomUUID() };
    setDemoFocusBlocks((prev) => [...prev, newBlock]);
    setDemoStats((prev) => ({ ...prev, totalXP: prev.totalXP + 10 }));
    toast({
      title: "Focus Block Created! 🎯",
      description: "+10 XP - Your protected time is scheduled",
    });
  }, []);

  const updateDemoFocusBlock = useCallback((id: string, updates: Partial<DemoFocusBlock>) => {
    setDemoFocusBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  }, []);

  const deleteDemoFocusBlock = useCallback((id: string) => {
    setDemoFocusBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const completeDemoHabit = useCallback((id: string) => {
    setDemoHabits((prev) =>
      prev.map((h) => {
        if (h.id === id && !h.completedToday) {
          toast({
            title: `${h.icon} Habit completed! +20 XP`,
            description: `${h.streak + 1} day streak!`,
          });
          return { ...h, completedToday: true, streak: h.streak + 1 };
        }
        return h;
      })
    );
    setDemoStats((prev) => ({ ...prev, totalXP: prev.totalXP + 20 }));
  }, []);

  const addDemoXP = useCallback((amount: number) => {
    setDemoStats((prev) => {
      const newXP = prev.totalXP + amount;
      const newLevel = Math.floor(newXP / 500) + 1;
      if (newLevel > prev.currentLevel) {
        toast({
          title: `🎉 Level Up! You're now Level ${newLevel}`,
          description: "Keep building great habits!",
        });
      }
      return { ...prev, totalXP: newXP, currentLevel: newLevel };
    });
  }, []);

  const getDemoDataForConversion = useCallback((): DemoData => {
    const savedData = localStorage.getItem(DEMO_STORAGE_KEY);
    if (savedData) {
      return JSON.parse(savedData);
    }
    return { 
      events: demoEvents, 
      tasks: demoTasks, 
      focusBlocks: demoFocusBlocks,
      stats: demoStats,
      habits: demoHabits,
      displayName: demoDisplayName,
    };
  }, [demoEvents, demoTasks, demoFocusBlocks, demoStats, demoHabits, demoDisplayName]);

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        demoTimeRemaining,
        demoEvents,
        demoTasks,
        demoFocusBlocks,
        demoStats,
        demoHabits,
        demoDisplayName,
        startDemo,
        endDemo,
        addDemoEvent,
        updateDemoEvent,
        deleteDemoEvent,
        addDemoTask,
        updateDemoTask,
        deleteDemoTask,
        addDemoFocusBlock,
        updateDemoFocusBlock,
        deleteDemoFocusBlock,
        completeDemoHabit,
        addDemoXP,
        getDemoDataForConversion,
        clearDemoData,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
};
