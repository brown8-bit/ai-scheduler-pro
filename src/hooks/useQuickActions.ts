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
    id: "focus-time",
    label: "Block focus time",
    prompt: "Block 2 hours of focus time tomorrow morning. No meetings, just deep work.",
    icon: "🎯"
  },
  {
    id: "morning-routine",
    label: "Morning routine",
    prompt: "Schedule my morning routine: 30 min exercise at 7am, then breakfast and planning at 8am.",
    icon: "🌅"
  },
  {
    id: "content-creation",
    label: "Content creation block",
    prompt: "Block 3 hours this afternoon for content creation - writing, editing, and brainstorming.",
    icon: "✏️"
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
