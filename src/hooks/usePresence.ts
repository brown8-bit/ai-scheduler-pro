import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface PresenceState {
  [key: string]: { user_id: string; online_at: string }[];
}

export const usePresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

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
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const isUserOnline = (userId: string) => onlineUsers.has(userId);

  return { onlineUsers, isUserOnline };
};
