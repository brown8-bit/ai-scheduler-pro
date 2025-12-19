import { Link } from "react-router-dom";
import { Shield, Lock } from "lucide-react";

interface PrivacyBadgeProps {
  variant?: "default" | "compact" | "inline";
  showLink?: boolean;
}

const PrivacyBadge = ({ variant = "default", showLink = true }: PrivacyBadgeProps) => {
  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Lock className="w-3 h-3 text-green-500" />
        <span>Private & encrypted</span>
        {showLink && (
          <Link to="/privacy" className="text-primary hover:underline ml-1">
            Learn more
          </Link>
        )}
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
          <Shield className="w-3 h-3 text-green-500" />
        </div>
        <span>Your data is private — we never sell it.</span>
        {showLink && (
          <Link to="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 sm:p-6 rounded-2xl bg-secondary/30 border border-border">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <p className="font-medium text-sm sm:text-base">Your data is private & encrypted</p>
          <p className="text-xs sm:text-sm text-muted-foreground">We never sell or share your information</p>
        </div>
      </div>
      {showLink && (
        <Link to="/privacy" className="text-xs sm:text-sm text-primary hover:underline">
          Read our Privacy Policy →
        </Link>
      )}
    </div>
  );
};

export default PrivacyBadge;
