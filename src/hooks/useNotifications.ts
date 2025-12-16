import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported("Notification" in window);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Notifications not supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        toast({
          title: "Notifications enabled! 🔔",
          description: "You'll receive reminders for your events and tasks.",
        });
        return true;
      } else if (result === "denied") {
        toast({
          title: "Notifications blocked",
          description: "Enable notifications in your browser settings to receive reminders.",
          variant: "destructive",
        });
        return false;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!isSupported || permission !== "granted") {
        return null;
      }

      try {
        const notification = new Notification(title, {
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          ...options,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };

        return notification;
      } catch (error) {
        console.error("Error sending notification:", error);
        return null;
      }
    },
    [isSupported, permission]
  );

  const scheduleNotification = useCallback(
    (title: string, options: NotificationOptions, scheduledTime: Date) => {
      if (!isSupported || permission !== "granted") {
        return null;
      }

      const now = new Date();
      const delay = scheduledTime.getTime() - now.getTime();

      if (delay <= 0) {
        return null;
      }

      const timeoutId = setTimeout(() => {
        sendNotification(title, options);
      }, delay);

      return timeoutId;
    },
    [isSupported, permission, sendNotification]
  );

  const scheduleEventReminder = useCallback(
    (eventTitle: string, eventDate: Date, minutesBefore: number = 15) => {
      const reminderTime = new Date(eventDate.getTime() - minutesBefore * 60 * 1000);
      
      return scheduleNotification(
        `Upcoming: ${eventTitle}`,
        {
          body: `Starting in ${minutesBefore} minutes`,
          tag: `event-${eventDate.getTime()}`,
        },
        reminderTime
      );
    },
    [scheduleNotification]
  );

  const scheduleTaskDeadline = useCallback(
    (taskTitle: string, dueDate: Date, hoursBefore: number = 1) => {
      const reminderTime = new Date(dueDate.getTime() - hoursBefore * 60 * 60 * 1000);
      
      return scheduleNotification(
        `Task Due Soon: ${taskTitle}`,
        {
          body: `Due in ${hoursBefore} hour${hoursBefore > 1 ? "s" : ""}`,
          tag: `task-${dueDate.getTime()}`,
        },
        reminderTime
      );
    },
    [scheduleNotification]
  );

  return {
    permission,
    isSupported,
    isEnabled: permission === "granted",
    requestPermission,
    sendNotification,
    scheduleNotification,
    scheduleEventReminder,
    scheduleTaskDeadline,
  };
};
