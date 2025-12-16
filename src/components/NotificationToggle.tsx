import { Button } from "@/components/ui/button";
import { Bell, BellOff, BellRing } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const NotificationToggle = () => {
  const { permission, isSupported, requestPermission, sendNotification } = useNotifications();

  if (!isSupported) {
    return null;
  }

  const handleClick = async () => {
    if (permission === "granted") {
      // Send a test notification
      sendNotification("Notifications are working! 🔔", {
        body: "You'll receive reminders for your events and tasks.",
      });
    } else {
      await requestPermission();
    }
  };

  const getIcon = () => {
    switch (permission) {
      case "granted":
        return <BellRing className="w-4 h-4" />;
      case "denied":
        return <BellOff className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getTooltipText = () => {
    switch (permission) {
      case "granted":
        return "Notifications enabled (click to test)";
      case "denied":
        return "Notifications blocked - enable in browser settings";
      default:
        return "Enable notifications for reminders";
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={permission === "granted" ? "default" : "outline"}
          size="icon"
          onClick={handleClick}
          disabled={permission === "denied"}
          className={permission === "granted" ? "bg-green-500 hover:bg-green-600" : ""}
        >
          {getIcon()}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{getTooltipText()}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default NotificationToggle;
