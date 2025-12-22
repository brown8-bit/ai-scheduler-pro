import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
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

interface DemoData {
  events: DemoEvent[];
  tasks: DemoTask[];
}

interface DemoContextType {
  isDemoMode: boolean;
  demoTimeRemaining: number; // in seconds
  demoEvents: DemoEvent[];
  demoTasks: DemoTask[];
  startDemo: () => void;
  endDemo: () => void;
  addDemoEvent: (event: Omit<DemoEvent, "id">) => void;
  updateDemoEvent: (id: string, updates: Partial<DemoEvent>) => void;
  deleteDemoEvent: (id: string) => void;
  addDemoTask: (task: Omit<DemoTask, "id">) => void;
  updateDemoTask: (id: string, updates: Partial<DemoTask>) => void;
  deleteDemoTask: (id: string) => void;
  getDemoDataForConversion: () => DemoData;
  clearDemoData: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

// Sample demo data
const generateSampleData = (): DemoData => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return {
    events: [
      {
        id: crypto.randomUUID(),
        title: "Morning Deep Work Block",
        description: "Focus time for content creation",
        event_date: new Date(now.setHours(9, 0, 0, 0)).toISOString(),
        reminder: true,
        category: "work",
        is_completed: false,
      },
      {
        id: crypto.randomUUID(),
        title: "Team Standup Call",
        description: "Weekly sync with the team",
        event_date: new Date(tomorrow.setHours(10, 0, 0, 0)).toISOString(),
        reminder: true,
        category: "work",
        is_completed: false,
      },
      {
        id: crypto.randomUUID(),
        title: "Gym Session",
        description: "Upper body workout",
        event_date: new Date(tomorrow.setHours(18, 0, 0, 0)).toISOString(),
        reminder: true,
        category: "health",
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
        description: "Check weekly metrics",
        due_date: nextWeek.toISOString().split("T")[0],
        priority: "medium",
        is_completed: false,
      },
      {
        id: crypto.randomUUID(),
        title: "Send invoice to client",
        description: null,
        due_date: now.toISOString().split("T")[0],
        priority: "high",
        is_completed: true,
      },
    ],
  };
};

export const DemoProvider = ({ children }: { children: ReactNode }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoTimeRemaining, setDemoTimeRemaining] = useState(0);
  const [demoEvents, setDemoEvents] = useState<DemoEvent[]>([]);
  const [demoTasks, setDemoTasks] = useState<DemoTask[]>([]);

  // Initialize from localStorage
  useEffect(() => {
    const startTime = localStorage.getItem(DEMO_START_KEY);
    if (startTime) {
      const elapsed = Date.now() - parseInt(startTime, 10);
      if (elapsed < DEMO_DURATION_MS) {
        setIsDemoMode(true);
        setDemoTimeRemaining(Math.floor((DEMO_DURATION_MS - elapsed) / 1000));
        
        // Load saved demo data
        const savedData = localStorage.getItem(DEMO_STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData) as DemoData;
          setDemoEvents(parsed.events || []);
          setDemoTasks(parsed.tasks || []);
        }
      } else {
        // Demo expired
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
            description: "Sign up to continue using Schedulr!",
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
        JSON.stringify({ events: demoEvents, tasks: demoTasks })
      );
    }
  }, [isDemoMode, demoEvents, demoTasks]);

  const startDemo = useCallback(() => {
    const sampleData = generateSampleData();
    setDemoEvents(sampleData.events);
    setDemoTasks(sampleData.tasks);
    setIsDemoMode(true);
    setDemoTimeRemaining(DEMO_DURATION_MS / 1000);
    localStorage.setItem(DEMO_START_KEY, Date.now().toString());
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(sampleData));
    
    toast({
      title: "Welcome to Demo Mode! 🎉",
      description: "You have 30 minutes to explore. Sign up anytime to save your data!",
    });
  }, []);

  const endDemo = useCallback(() => {
    setIsDemoMode(false);
    setDemoTimeRemaining(0);
    localStorage.removeItem(DEMO_START_KEY);
    // Keep demo data for potential conversion on signup
  }, []);

  const clearDemoData = useCallback(() => {
    setDemoEvents([]);
    setDemoTasks([]);
    localStorage.removeItem(DEMO_STORAGE_KEY);
    localStorage.removeItem(DEMO_START_KEY);
  }, []);

  const addDemoEvent = useCallback((event: Omit<DemoEvent, "id">) => {
    const newEvent: DemoEvent = { ...event, id: crypto.randomUUID() };
    setDemoEvents((prev) => [...prev, newEvent]);
  }, []);

  const updateDemoEvent = useCallback((id: string, updates: Partial<DemoEvent>) => {
    setDemoEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
  }, []);

  const deleteDemoEvent = useCallback((id: string) => {
    setDemoEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addDemoTask = useCallback((task: Omit<DemoTask, "id">) => {
    const newTask: DemoTask = { ...task, id: crypto.randomUUID() };
    setDemoTasks((prev) => [...prev, newTask]);
  }, []);

  const updateDemoTask = useCallback((id: string, updates: Partial<DemoTask>) => {
    setDemoTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  const deleteDemoTask = useCallback((id: string) => {
    setDemoTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getDemoDataForConversion = useCallback((): DemoData => {
    // Also check localStorage in case state is cleared
    const savedData = localStorage.getItem(DEMO_STORAGE_KEY);
    if (savedData) {
      return JSON.parse(savedData);
    }
    return { events: demoEvents, tasks: demoTasks };
  }, [demoEvents, demoTasks]);

  return (
    <DemoContext.Provider
      value={{
        isDemoMode,
        demoTimeRemaining,
        demoEvents,
        demoTasks,
        startDemo,
        endDemo,
        addDemoEvent,
        updateDemoEvent,
        deleteDemoEvent,
        addDemoTask,
        updateDemoTask,
        deleteDemoTask,
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
