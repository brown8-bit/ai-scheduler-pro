import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Shield, Smartphone, CheckCircle, Copy, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TwoFactorSetupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const TwoFactorSetup = ({ open, onOpenChange, onComplete }: TwoFactorSetupProps) => {
  const [step, setStep] = useState<"intro" | "setup" | "verify" | "complete">("intro");
  const [totpSecret, setTotpSecret] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [factorId, setFactorId] = useState("");

  const handleStartSetup = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });

      if (error) throw error;

      if (data) {
        setTotpSecret(data.totp.secret);
        setQrCode(data.totp.qr_code);
        setFactorId(data.id);
        setStep("setup");
      }
    } catch (error: any) {
      console.error("Error setting up 2FA:", error);
      toast({
        title: "Setup Failed",
        description: error.message || "Could not set up 2FA. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit code from your authenticator app.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (error) throw error;

      setStep("complete");
      toast({
        title: "2FA Enabled! 🔐",
        description: "Two-factor authentication is now active on your account.",
      });
    } catch (error: any) {
      console.error("Error verifying 2FA:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(totpSecret);
    toast({
      title: "Copied!",
      description: "Secret key copied to clipboard.",
    });
  };

  const handleClose = () => {
    setStep("intro");
    setVerificationCode("");
    setTotpSecret("");
    setQrCode("");
    onOpenChange(false);
    if (step === "complete") {
      onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {step === "complete" ? "2FA Enabled" : "Set Up Two-Factor Authentication"}
          </DialogTitle>
          <DialogDescription>
            {step === "intro" && "Add an extra layer of security to your account."}
            {step === "setup" && "Scan the QR code with your authenticator app."}
            {step === "verify" && "Enter the code from your authenticator app."}
            {step === "complete" && "Your account is now more secure."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === "intro" && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Use an authenticator app like Google Authenticator, Authy, or 1Password to generate verification codes.
                </p>
              </div>
              <Button
                variant="hero"
                className="w-full"
                onClick={handleStartSetup}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Maybe later
              </Button>
            </div>
          )}

          {step === "setup" && (
            <div className="space-y-4">
              <div className="flex justify-center">
                {qrCode && (
                  <div className="p-4 bg-white rounded-xl">
                    <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  Or enter this code manually:
                </p>
                <div className="flex items-center justify-center gap-2">
                  <code className="px-3 py-2 bg-muted rounded-lg text-sm font-mono">
                    {totpSecret}
                  </code>
                  <Button variant="ghost" size="icon" onClick={copySecret}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                variant="hero"
                className="w-full"
                onClick={() => setStep("verify")}
              >
                I've scanned the code
              </Button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
              
              <div className="flex justify-center">
                <InputOTP
                  value={verificationCode}
                  onChange={setVerificationCode}
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
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify and Enable"
                )}
              </Button>

              <button
                type="button"
                onClick={() => setStep("setup")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Back to QR code
              </button>
            </div>
          )}

          {step === "complete" && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold">All set!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Two-factor authentication is now enabled. You'll need your authenticator app when signing in.
                </p>
              </div>
              <Button variant="hero" className="w-full" onClick={handleClose}>
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorSetup;
