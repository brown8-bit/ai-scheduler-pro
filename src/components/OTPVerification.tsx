import { useState, useEffect } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Mail, RefreshCw, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface OTPVerificationProps {
  email: string;
  onVerified: () => void;
  onBack: () => void;
}

const OTPVerification = ({ email, onVerified, onBack }: OTPVerificationProps) => {
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke("email-otp", {
        body: { email, action: "verify", code },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Email Verified! ✅",
          description: "Your email has been verified successfully.",
        });
        onVerified();
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid or expired code.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsResending(true);

    try {
      const { data, error } = await supabase.functions.invoke("email-otp", {
        body: { email, action: "send" },
      });

      if (error) throw error;

      if (data.success) {
        setCountdown(60); // 60 second cooldown
        setCode("");
        toast({
          title: "Code Sent! 📧",
          description: "A new verification code has been sent to your email.",
        });
      }
    } catch (error: any) {
      console.error("OTP resend error:", error);
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send verification code.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <Mail className="w-8 h-8 text-primary" />
      </div>
      
      <div>
        <h2 className="text-lg font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground mt-1">
          We've sent a 6-digit code to
        </p>
        <p className="text-sm font-medium text-foreground">{email}</p>
      </div>

      <div className="flex justify-center">
        <InputOTP
          value={code}
          onChange={setCode}
          maxLength={6}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button
        variant="hero"
        className="w-full"
        onClick={handleVerify}
        disabled={isVerifying || code.length !== 6}
      >
        {isVerifying ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Verify Email
          </>
        )}
      </Button>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0 || isResending}
          className="text-sm text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {isResending ? (
            "Sending..."
          ) : countdown > 0 ? (
            `Resend code in ${countdown}s`
          ) : (
            "Didn't receive the code? Resend"
          )}
        </button>
        
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Use a different email
        </button>
      </div>
    </div>
  );
};

export default OTPVerification;
