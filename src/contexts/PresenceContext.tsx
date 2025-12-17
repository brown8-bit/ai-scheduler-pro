import { createContext, useContext, ReactNode } from "react";
import { usePresence } from "@/hooks/usePresence";

interface PresenceContextType {
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: new Set(),
  isUserOnline: () => false,
});

export const PresenceProvider = ({ children }: { children: ReactNode }) => {
  const presence = usePresence();

  return (
    <PresenceContext.Provider value={presence}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresenceContext = () => useContext(PresenceContext);
