import { useState, useEffect } from "react";

interface CountdownTimerProps {
  expiresAt: string;
  className?: string;
}

const CountdownTimer = ({ expiresAt, className = "" }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  if (isExpired) {
    return (
      <span className={`text-destructive font-semibold ${className}`}>
        Expired
      </span>
    );
  }

  if (!timeLeft) {
    return null;
  }

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  // Show different formats based on time remaining
  if (timeLeft.days > 0) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <TimeBlock value={timeLeft.days} label="d" />
        <span className="text-muted-foreground">:</span>
        <TimeBlock value={timeLeft.hours} label="h" />
        <span className="text-muted-foreground">:</span>
        <TimeBlock value={timeLeft.minutes} label="m" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <TimeBlock value={timeLeft.hours} label="h" />
      <span className="text-muted-foreground">:</span>
      <TimeBlock value={timeLeft.minutes} label="m" />
      <span className="text-muted-foreground">:</span>
      <TimeBlock value={timeLeft.seconds} label="s" urgent />
    </div>
  );
};

const TimeBlock = ({
  value,
  label,
  urgent = false,
}: {
  value: number;
  label: string;
  urgent?: boolean;
}) => (
  <div className={`flex items-baseline ${urgent ? "animate-pulse text-destructive" : ""}`}>
    <span className="font-mono font-bold text-sm">
      {value.toString().padStart(2, "0")}
    </span>
    <span className="text-xs text-muted-foreground">{label}</span>
  </div>
);

export default CountdownTimer;