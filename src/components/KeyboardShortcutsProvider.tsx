import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";

interface KeyboardShortcutsContextType {
  openShortcutsModal: () => void;
  closeShortcutsModal: () => void;
  triggerNewEvent: () => void;
  setNewEventHandler: (handler: () => void) => void;
  setCalendarHandlers: (handlers: {
    onPrevious?: () => void;
    onNext?: () => void;
    onToday?: () => void;
  }) => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null);

export const useKeyboardShortcutsContext = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error("useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider");
  }
  return context;
};

interface KeyboardShortcutsProviderProps {
  children: ReactNode;
}

export const KeyboardShortcutsProvider = ({ children }: KeyboardShortcutsProviderProps) => {
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [newEventHandler, setNewEventHandlerState] = useState<(() => void) | null>(null);
  const [calendarHandlers, setCalendarHandlersState] = useState<{
    onPrevious?: () => void;
    onNext?: () => void;
    onToday?: () => void;
  }>({});

  const openShortcutsModal = useCallback(() => setShortcutsModalOpen(true), []);
  const closeShortcutsModal = useCallback(() => setShortcutsModalOpen(false), []);

  const triggerNewEvent = useCallback(() => {
    newEventHandler?.();
  }, [newEventHandler]);

  const setNewEventHandler = useCallback((handler: () => void) => {
    setNewEventHandlerState(() => handler);
  }, []);

  const setCalendarHandlers = useCallback((handlers: {
    onPrevious?: () => void;
    onNext?: () => void;
    onToday?: () => void;
  }) => {
    setCalendarHandlersState(handlers);
  }, []);

  useKeyboardShortcuts({
    onOpenShortcutsModal: openShortcutsModal,
    onNewEvent: triggerNewEvent,
    onPrevious: calendarHandlers.onPrevious,
    onNext: calendarHandlers.onNext,
    onToday: calendarHandlers.onToday,
    enabled: true,
  });

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        openShortcutsModal,
        closeShortcutsModal,
        triggerNewEvent,
        setNewEventHandler,
        setCalendarHandlers,
      }}
    >
      {children}
      <KeyboardShortcutsModal 
        open={shortcutsModalOpen} 
        onOpenChange={setShortcutsModalOpen} 
      />
    </KeyboardShortcutsContext.Provider>
  );
};
