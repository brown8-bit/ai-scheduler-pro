import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Mail, Lock, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate admin login
    setTimeout(() => {
      toast({
        title: "Admin access granted",
        description: "Welcome to the admin dashboard.",
      });
      navigate("/admin");
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-foreground flex flex-col">
      {/* Back Link */}
      <div className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-background transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center">
              <div className="w-14 h-14 rounded-xl bg-destructive flex items-center justify-center shadow-lg">
                <Shield className="w-7 h-7 text-destructive-foreground" />
              </div>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-background">Admin Access</h1>
            <p className="mt-2 text-muted-foreground">Authorized personnel only</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-card p-8 rounded-2xl shadow-card border border-border">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@schedulr.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-destructive/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-destructive/50 transition-all"
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-6 bg-destructive hover:bg-destructive/90"
              disabled={isLoading}
            >
              {isLoading ? "Authenticating..." : "Access Admin Panel"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
