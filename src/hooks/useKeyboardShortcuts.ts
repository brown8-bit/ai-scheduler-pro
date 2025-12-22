import { useEffect, useCallback, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface KeyboardShortcutsOptions {
  onOpenShortcutsModal?: () => void;
  onNewEvent?: () => void;
  onToggleSidebar?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  enabled?: boolean;
}

export const useKeyboardShortcuts = (options: KeyboardShortcutsOptions = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const { 
    onOpenShortcutsModal, 
    onNewEvent, 
    onToggleSidebar,
    onPrevious,
    onNext,
    onToday,
    enabled = true 
  } = options;

  const isInputFocused = useCallback(() => {
    const activeElement = document.activeElement;
    if (!activeElement) return false;
    
    const tagName = activeElement.tagName.toLowerCase();
    const isEditable = activeElement.getAttribute("contenteditable") === "true";
    const isInput = tagName === "input" || tagName === "textarea" || tagName === "select";
    
    return isInput || isEditable;
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger shortcuts when typing in inputs
    if (isInputFocused()) {
      // Allow Escape to blur input
      if (event.key === "Escape") {
        (document.activeElement as HTMLElement)?.blur();
      }
      return;
    }

    const key = event.key.toLowerCase();
    const isCmd = event.metaKey || event.ctrlKey;

    // Handle ? for shortcuts modal
    if (event.key === "?" || (event.shiftKey && key === "/")) {
      event.preventDefault();
      onOpenShortcutsModal?.();
      return;
    }

    // Handle Cmd/Ctrl + K for quick search (future feature)
    if (isCmd && key === "k") {
      event.preventDefault();
      // Quick search - could be implemented later
      return;
    }

    // Handle Cmd/Ctrl + / for sidebar toggle
    if (isCmd && key === "/") {
      event.preventDefault();
      onToggleSidebar?.();
      return;
    }

    // Handle G + key combinations for navigation
    if (pendingKey === "g") {
      event.preventDefault();
      setPendingKey(null);
      
      switch (key) {
        case "d":
          navigate("/dashboard");
          break;
        case "c":
          navigate("/calendar");
          break;
        case "t":
          navigate("/tasks");
          break;
        case "s":
          navigate("/settings");
          break;
        default:
          break;
      }
      return;
    }

    // Set pending key for G combinations
    if (key === "g" && !isCmd && !event.shiftKey) {
      event.preventDefault();
      setPendingKey("g");
      // Clear pending key after 1 second
      setTimeout(() => setPendingKey(null), 1000);
      return;
    }

    // Handle N for new event
    if (key === "n" && !isCmd && !event.shiftKey) {
      event.preventDefault();
      onNewEvent?.();
      return;
    }

    // Handle T for today (calendar)
    if (key === "t" && !isCmd && !event.shiftKey && location.pathname === "/calendar") {
      event.preventDefault();
      onToday?.();
      return;
    }

    // Handle arrow keys for calendar navigation
    if (location.pathname === "/calendar") {
      if (key === "arrowleft" && !isCmd) {
        event.preventDefault();
        onPrevious?.();
        return;
      }
      if (key === "arrowright" && !isCmd) {
        event.preventDefault();
        onNext?.();
        return;
      }
    }

    // Handle Escape to close modals (handled by Radix UI mostly)
    if (key === "escape") {
      // Let the event bubble to close modals
      return;
    }
  }, [enabled, isInputFocused, navigate, location.pathname, pendingKey, onOpenShortcutsModal, onNewEvent, onToggleSidebar, onPrevious, onNext, onToday]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { pendingKey };
};
