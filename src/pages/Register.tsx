import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Mail, Lock, ArrowLeft, Gift, Sparkles, CheckCircle, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/contexts/DemoContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import PasswordInput, { validatePassword } from "@/components/PasswordInput";
import OTPVerification from "@/components/OTPVerification";
import TwoFactorSetup from "@/components/TwoFactorSetup";
import { Checkbox } from "@/components/ui/checkbox";

const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" });

type RegistrationStep = "email" | "verify" | "password" | "complete";

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get("ref");
  const { signUp, user, loading } = useAuth();
  const { setTourActive, setCurrentTourStep } = useDemo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<RegistrationStep>("email");
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      // If user is logged in and we're past verification, show 2FA setup option
      if (step === "complete") {
        setShow2FASetup(true);
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, loading, navigate, step]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({
        title: "Invalid Email",
        description: emailResult.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Send OTP to email
      const { data, error } = await supabase.functions.invoke("email-otp", {
        body: { email, action: "send" },
      });

      if (error) throw error;

      if (data.success) {
        setStep("verify");
        toast({
          title: "Code Sent! 📧",
          description: "Check your email for the verification code.",
        });
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({
        title: "Failed to Send",
        description: error.message || "Could not send verification code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailVerified = () => {
    setStep("password");
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      toast({
        title: "Password Requirements",
        description: "Please meet all password requirements.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await signUp(email, password);
    
    if (error) {
      let errorMessage = error.message;
      if (error.message.includes("already registered")) {
        errorMessage = "This email is already registered. Please sign in instead.";
      }
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Process referral if there's a referral code
    if (referralCode) {
      try {
        const { data: { user: newUser } } = await supabase.auth.getUser();
        if (newUser) {
          await supabase.functions.invoke("process-referral", {
            body: { 
              referral_code: referralCode, 
              referred_user_id: newUser.id 
            },
          });
        }
      } catch (error) {
        console.error("Error processing referral:", error);
      }
    }

    toast({
      title: "Account created! 🎉",
      description: "Welcome to Schedulr!",
    });
    
    setStep("complete");
    setIsLoading(false);
  };

  const handle2FAComplete = () => {
    setShow2FASetup(false);
    // Start the full tour for new users
    setCurrentTourStep(0);
    setTourActive(true);
    navigate("/dashboard");
  };

  const handleSkip2FA = () => {
    // Start the full tour for new users
    setCurrentTourStep(0);
    setTourActive(true);
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Back Link */}
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-elegant">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
            </Link>
            <h1 className="mt-4 text-2xl font-bold">
              {step === "complete" ? "Welcome to Schedulr! 🎉" : "Create an account"}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {step === "email" && "Enter your email to get started"}
              {step === "verify" && "Verify your email address"}
              {step === "password" && "Set a secure password"}
              {step === "complete" && "Your account is ready"}
            </p>
            {referralCode && step === "email" && (
              <div className="mt-3 inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm">
                <Gift className="h-4 w-4" />
                Referred by a friend!
              </div>
            )}
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {["email", "verify", "password"].map((s) => {
              const stepOrder = ["email", "verify", "password", "complete"];
              const currentIndex = stepOrder.indexOf(step);
              const sIndex = stepOrder.indexOf(s);
              const isPast = currentIndex > sIndex;
              const isCurrent = step === s;
              
              return (
                <div
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    isPast
                      ? "w-8 bg-primary"
                      : isCurrent
                      ? "w-8 bg-primary/50"
                      : "w-4 bg-muted"
                  }`}
                />
              );
            })}
          </div>

          {/* Form */}
          <div className="bg-card p-8 rounded-2xl shadow-card border border-border">
            {step === "email" && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    />
                  </div>
                </div>

                {/* Terms Agreement */}
                <div className={`p-4 rounded-xl border-2 transition-all ${
                  agreedToTerms 
                    ? "border-primary bg-primary/5" 
                    : "border-amber-500/50 bg-amber-500/5"
                }`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                      className="mt-0.5 h-5 w-5"
                    />
                    <label htmlFor="terms" className="text-sm font-medium leading-relaxed cursor-pointer">
                      I agree to the{" "}
                      <Link to="/terms" target="_blank" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" target="_blank" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  
                  {/* Quick Summary */}
                  <div className="mt-3 pl-8 space-y-1.5">
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                      Your data is encrypted and secure
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                      We never sell your personal information
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                      Cancel anytime, export your data
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading || !agreedToTerms}
                >
                  {isLoading ? "Sending code..." : "Continue"}
                </Button>

                {!agreedToTerms && (
                  <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <FileText className="w-3 h-3" />
                    Please agree to the terms to continue
                  </p>
                )}

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </form>
            )}

            {step === "verify" && (
              <OTPVerification
                email={email}
                onVerified={handleEmailVerified}
                onBack={() => setStep("email")}
              />
            )}

            {step === "password" && (
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Create Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground z-10" />
                    <PasswordInput
                      value={password}
                      onChange={setPassword}
                      showRequirements
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full"
                  disabled={isLoading || !validatePassword(password).valid}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            )}

            {step === "complete" && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-muted-foreground">
                  Would you like to enable two-factor authentication for extra security?
                </p>
                <div className="space-y-2">
                  <Button
                    variant="hero"
                    className="w-full"
                    onClick={() => setShow2FASetup(true)}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Set Up 2FA
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={handleSkip2FA}
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TwoFactorSetup
        open={show2FASetup}
        onOpenChange={setShow2FASetup}
        onComplete={handle2FAComplete}
      />
    </div>
  );
};

export default Register;
