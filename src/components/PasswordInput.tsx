import { useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special character (!@#$%^&*)", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showRequirements?: boolean;
  className?: string;
  id?: string;
}

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors = PASSWORD_REQUIREMENTS
    .filter((req) => !req.test(password))
    .map((req) => req.label);
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

export const PasswordInput = ({
  value,
  onChange,
  placeholder = "••••••••",
  showRequirements = false,
  className,
  id,
}: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const getStrength = (): { level: number; label: string; color: string } => {
    const passed = PASSWORD_REQUIREMENTS.filter((req) => req.test(value)).length;
    const total = PASSWORD_REQUIREMENTS.length;
    const percentage = (passed / total) * 100;

    if (percentage === 0) return { level: 0, label: "", color: "bg-muted" };
    if (percentage <= 40) return { level: 1, label: "Weak", color: "bg-red-500" };
    if (percentage <= 60) return { level: 2, label: "Fair", color: "bg-amber-500" };
    if (percentage <= 80) return { level: 3, label: "Good", color: "bg-yellow-500" };
    return { level: 4, label: "Strong", color: "bg-green-500" };
  };

  const strength = getStrength();
  const showDetails = showRequirements && (isFocused || value.length > 0);

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "w-full pl-10 pr-12 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
            className
          )}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>

      {showDetails && (
        <div className="space-y-2 animate-fade-in">
          {/* Strength bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden flex gap-0.5">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "h-full flex-1 rounded-full transition-colors",
                    strength.level >= level ? strength.color : "bg-muted"
                  )}
                />
              ))}
            </div>
            {strength.label && (
              <span className={cn(
                "text-xs font-medium",
                strength.color === "bg-red-500" && "text-red-500",
                strength.color === "bg-amber-500" && "text-amber-500",
                strength.color === "bg-yellow-500" && "text-yellow-500",
                strength.color === "bg-green-500" && "text-green-500"
              )}>
                {strength.label}
              </span>
            )}
          </div>

          {/* Requirements list */}
          <ul className="space-y-1">
            {PASSWORD_REQUIREMENTS.map((req) => {
              const passed = req.test(value);
              return (
                <li
                  key={req.label}
                  className={cn(
                    "flex items-center gap-2 text-xs transition-colors",
                    passed ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                  )}
                >
                  {passed ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <X className="w-3.5 h-3.5" />
                  )}
                  {req.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordInput;
