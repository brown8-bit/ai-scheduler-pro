import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Share2, LogOut, Settings, LayoutDashboard, Trophy, CalendarDays, Target, TrendingUp, Users } from "lucide-react";
import schedulrLogo from "@/assets/schedulr-logo.png";
import { useState, useEffect, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ShareLinkModal from "@/components/ShareLinkModal";
import { toast } from "@/hooks/use-toast";

const Navbar = forwardRef<HTMLElement>((_, ref) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setAvatarUrl(null);
      setDisplayName("");
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, display_name")
      .eq("user_id", user.id)
      .single();
    
    if (data) {
      setAvatarUrl(data.avatar_url);
      setDisplayName(data.display_name || user.email?.split("@")[0] || "");
    } else {
      setDisplayName(user.email?.split("@")[0] || "");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "See you next time! 👋",
    });
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/chat", label: "AI Chat" },
    { path: "/dashboard", label: "Dashboard" },
    { path: "/calendar", label: "Calendar" },
    { path: "/habits", label: "Habits" },
    { path: "/progress", label: "Progress" },
    { path: "/achievements", label: "Achievements" },
    { path: "/community", label: "Community" },
  ];

  const userInitial = displayName.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <nav ref={ref} className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src={schedulrLogo} 
              alt="Schedulr" 
              className="w-9 h-9 rounded-lg shadow-elegant group-hover:shadow-lg group-hover:scale-105 transition-all"
            />
            <span className="font-bold text-xl text-foreground">Schedulr</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant="ghost"
                  className={isActive(link.path) ? "bg-accent" : ""}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <ShareLinkModal 
                  trigger={
                    <Button variant="outline" className="gap-2">
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  }
                />
                <Link to="/dashboard">
                  <Button variant="hero" size="default">
                    Dashboard
                  </Button>
                </Link>
                
                {/* Avatar Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full">
                      <Avatar className="w-9 h-9 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{displayName || "User"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/dashboard")} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/calendar")} className="cursor-pointer">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      Calendar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/habits")} className="cursor-pointer">
                      <Target className="mr-2 h-4 w-4" />
                      Daily Habits
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/progress")} className="cursor-pointer">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/achievements")} className="cursor-pointer">
                      <Trophy className="mr-2 h-4 w-4" />
                      Achievements
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <ShareLinkModal 
                  trigger={
                    <Button variant="outline" className="gap-2">
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  }
                />
                <Link to="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button variant="hero" size="default">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${isActive(link.path) ? "bg-accent" : ""}`}
                  >
                    {link.label}
                  </Button>
                </Link>
              ))}
              <hr className="my-2 border-border" />
              {user ? (
                <>
                  {/* Mobile Profile Section */}
                  <Link to="/settings" onClick={() => setMobileMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent transition-colors">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{displayName || "User"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Settings className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </Link>
                  <ShareLinkModal 
                    trigger={
                      <Button variant="outline" className="w-full gap-2">
                        <Share2 className="w-4 h-4" />
                        Share Booking Link
                      </Button>
                    }
                  />
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="hero" className="w-full">
                      Dashboard
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2" 
                    onClick={() => { handleSignOut(); setMobileMenuOpen(false); }}
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="hero" className="w-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
});

Navbar.displayName = "Navbar";

export default Navbar;
