import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Mail, Lock, ArrowLeft, Sparkles, CheckCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import TwoFactorSetup from "@/components/TwoFactorSetup";

const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" });
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" });

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signInWithMagicLink, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const handleMagicLink = async (e: React.FormEvent) => {
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
    
    const { error } = await signInWithMagicLink(email);
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setMagicLinkSent(true);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      toast({
        title: "Invalid Password",
        description: passwordResult.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Login Failed",
        description: error.message === "Invalid login credentials" 
          ? "Invalid email or password. Please try again."
          : error.message,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    toast({
      title: "Welcome back! 👋",
      description: "You have successfully logged in.",
    });
    
    navigate("/dashboard");
    setIsLoading(false);
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
            <h1 className="mt-4 text-2xl font-bold">Welcome back! 👋</h1>
            <p className="mt-2 text-muted-foreground">We're glad to see you again</p>
          </div>

          {/* Form */}
          <div className="bg-card p-8 rounded-2xl shadow-card border border-border">
            {useMagicLink ? (
              magicLinkSent ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-lg font-semibold mb-2">Check your email</h2>
                  <p className="text-muted-foreground mb-6">
                    We've sent a magic link to <strong>{email}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Click the link in your email to sign in instantly.
                  </p>
                  <button
                    onClick={() => {
                      setMagicLinkSent(false);
                      setEmail("");
                    }}
                    className="mt-4 text-primary text-sm font-medium hover:underline"
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMagicLink}>
                  <div className="space-y-4">
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
                  </div>

                  <Button
                    type="submit"
                    variant="hero"
                    size="lg"
                    className="w-full mt-6"
                    disabled={isLoading}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isLoading ? "Sending..." : "Send Magic Link"}
                  </Button>

                  <div className="mt-6 text-center">
                    <button
                      type="button"
                      onClick={() => setUseMagicLink(false)}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Use password instead
                    </button>
                  </div>
                </form>
              )
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
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

                  <div>
                    <label className="text-sm font-medium mb-2 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-12 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
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
                    <div className="mt-2 text-right">
                      <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  size="lg"
                  className="w-full mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full"
                  onClick={() => setUseMagicLink(true)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Sign in with Magic Link
                </Button>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-primary font-medium hover:underline">
                    Sign up
                  </Link>
                </p>
              </form>
            )}
          </div>

          {/* 2FA Setup link for logged-in users */}
          {user && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShow2FASetup(true)}
                className="text-sm text-primary hover:underline"
              >
                Set up two-factor authentication
              </button>
            </div>
          )}
        </div>
      </div>

      <TwoFactorSetup
        open={show2FASetup}
        onOpenChange={setShow2FASetup}
        onComplete={() => setShow2FASetup(false)}
      />
    </div>
  );
};

export default Login;
