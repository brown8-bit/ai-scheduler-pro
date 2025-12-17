import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface PresenceState {
  [key: string]: { user_id: string; online_at: string }[];
}

export const usePresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const lastUpdateRef = useRef<number>(0);

  // Update last_seen_at in the database
  const updateLastSeen = useCallback(async () => {
    if (!user) return;
    
    // Throttle updates to once per minute
    const now = Date.now();
    if (now - lastUpdateRef.current < 60000) return;
    lastUpdateRef.current = now;

    await supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("user_id", user.id);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state: PresenceState = channel.presenceState();
        const online = new Set<string>();
        Object.values(state).forEach((presences) => {
          presences.forEach((presence) => {
            online.add(presence.user_id);
          });
        });
        setOnlineUsers(online);
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          newPresences.forEach((presence: any) => {
            if (presence.user_id) {
              updated.add(presence.user_id);
            }
          });
          return updated;
        });
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          leftPresences.forEach((presence: any) => {
            if (presence.user_id) {
              updated.delete(presence.user_id);
            }
          });
          return updated;
        });
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
          // Update last seen on initial connection
          updateLastSeen();
        }
      });

    // Update last seen periodically while online
    const intervalId = setInterval(updateLastSeen, 60000);

    // Update last seen when user leaves
    const handleBeforeUnload = () => {
      navigator.sendBeacon &&
        supabase
          .from("profiles")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("user_id", user.id);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Final update on cleanup
      updateLastSeen();
    };
  }, [user, updateLastSeen]);

  const isUserOnline = (userId: string) => onlineUsers.has(userId);

  return { onlineUsers, isUserOnline };
};
