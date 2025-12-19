import { useState, useEffect } from "react";

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: string;
}

const QUICK_ACTIONS_KEY = "schedulr_quick_actions";

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: "content-creation",
    label: "Content creation block",
    prompt: "Block 3 hours tomorrow morning for content creation - recording videos, writing newsletter, and brainstorming ideas.",
    icon: "🎬"
  },
  {
    id: "client-calls",
    label: "Client calls day",
    prompt: "Block 2pm-5pm on Thursday for client calls. Leave 15 min buffers between each call.",
    icon: "📞"
  },
  {
    id: "build-session",
    label: "Build in public session",
    prompt: "Schedule a 4-hour deep work block this weekend for building my side project. No distractions.",
    icon: "🚀"
  }
];

export const useQuickActions = () => {
  const [quickActions, setQuickActions] = useState<QuickAction[]>(() => {
    const stored = localStorage.getItem(QUICK_ACTIONS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_QUICK_ACTIONS;
      }
    }
    return DEFAULT_QUICK_ACTIONS;
  });

  useEffect(() => {
    localStorage.setItem(QUICK_ACTIONS_KEY, JSON.stringify(quickActions));
  }, [quickActions]);

  const updateQuickAction = (id: string, updates: Partial<QuickAction>) => {
    setQuickActions(prev => 
      prev.map(action => 
        action.id === id ? { ...action, ...updates } : action
      )
    );
  };

  const resetToDefaults = () => {
    setQuickActions(DEFAULT_QUICK_ACTIONS);
  };

  return {
    quickActions,
    setQuickActions,
    updateQuickAction,
    resetToDefaults
  };
};
