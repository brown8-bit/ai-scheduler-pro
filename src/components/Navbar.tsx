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
import { Menu, X, Share2, LogOut, Settings, LayoutDashboard, Trophy, CalendarDays, Target, TrendingUp, Users, User, ChevronDown, MessageSquare, Timer, BarChart3, Sparkles, Clock, BookTemplate, Briefcase, Receipt, UserPlus, Mic, ListTodo, GraduationCap, Mail, Shield, DollarSign } from "lucide-react";
import schedulrLogo from "@/assets/schedulr-logo.png";
import { useState, useEffect, forwardRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ShareLinkModal from "@/components/ShareLinkModal";
import { toast } from "@/hooks/use-toast";
import { PresenceIndicator } from "@/components/PresenceIndicator";

const Navbar = forwardRef<HTMLElement>((_, ref) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [gamificationEnabled, setGamificationEnabled] = useState(false); // Default off

  useEffect(() => {
    if (user) {
      fetchProfile();
      checkAdminStatus();
    } else {
      setAvatarUrl(null);
      setDisplayName("");
      setIsAdmin(false);
      setGamificationEnabled(false); // Ensure off for guests
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url, display_name, gamification_enabled")
      .eq("user_id", user.id)
      .single();
    
    if (data) {
      setAvatarUrl(data.avatar_url);
      setDisplayName(data.display_name || user.email?.split("@")[0] || "");
      setGamificationEnabled(data.gamification_enabled ?? true);
    } else {
      setDisplayName(user.email?.split("@")[0] || "");
    }
  };

  const checkAdminStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
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

  const navLinks = useMemo(() => {
    const links: { path: string; label: string; icon: any; highlight?: boolean }[] = [
      { path: "/", label: "Home", icon: null },
      { path: "/chat", label: "AI Chat", icon: null },
      { path: isAdmin ? "/admin" : "/dashboard", label: "Dashboard", icon: null },
      { path: "/calendar", label: "Calendar", icon: CalendarDays },
      { path: "/pricing", label: "Pricing", icon: null },
    ];
    if (gamificationEnabled) {
      links.splice(4, 0, { path: "/community", label: "Community", icon: Users, highlight: true });
    }
    return links;
  }, [isAdmin, gamificationEnabled]);

  const featureLinks = useMemo(() => {
    const links = [
      { path: "/calendar", label: "Calendar", icon: CalendarDays },
      { path: "/tasks", label: "Tasks", icon: ListTodo },
      { path: "/habits", label: "Daily Habits", icon: Target },
      { path: "/timer", label: "Pomodoro Timer", icon: Timer },
      { path: "/grades", label: "Grade Tracker", icon: GraduationCap },
      { path: "/voice-notes", label: "Voice Notes", icon: Mic },
      { path: "/templates", label: "Templates", icon: BookTemplate },
      { path: "/progress", label: "Progress", icon: TrendingUp },
      { path: "/analytics", label: "Analytics", icon: BarChart3 },
    ];
    if (gamificationEnabled) {
      links.push({ path: "/achievements", label: "Achievements", icon: Trophy });
      links.push({ path: "/community", label: "Community", icon: Users });
    }
    return links;
  }, [gamificationEnabled]);

  const businessLinks = [
    { path: "/clients", label: "Clients", icon: UserPlus },
    { path: "/team", label: "Team", icon: Briefcase },
    { path: "/invoices", label: "Invoices", icon: Receipt },
  ];

  const userInitial = displayName.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <nav ref={ref} className="fixed top-0 left-0 right-0 z-[100] bg-background md:bg-background/80 md:backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative inline-flex flex-shrink-0">
              <img 
                src={schedulrLogo} 
                alt="Schedulr" 
                className="h-9 w-auto max-w-none object-contain rounded-lg shadow-elegant group-hover:shadow-glow group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 ease-out"
              />
              <div className="absolute inset-0 rounded-lg bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md -z-10" />
            </div>
            <span className="font-bold text-xl text-foreground group-hover:text-primary transition-colors duration-300">Schedulr</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 ml-8">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path}>
                <Button
                  variant={link.highlight && !isActive(link.path) ? "outline" : "ghost"}
                  className={`${isActive(link.path) ? "bg-accent" : ""} ${link.icon ? "gap-1.5" : ""} ${link.highlight && !isActive(link.path) ? "border-primary/50 text-primary hover:bg-primary/10" : ""}`}
                >
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                  {link.highlight && !isActive(link.path) && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full">NEW</span>
                  )}
                </Button>
              </Link>
            ))}
            
            {/* Features Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1">
                  Features
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                <DropdownMenuLabel>Productivity</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {featureLinks.map((link) => (
                  <DropdownMenuItem 
                    key={link.path} 
                    onClick={() => navigate(link.path)} 
                    className="cursor-pointer"
                  >
                    <link.icon className="mr-2 h-4 w-4" />
                    {link.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Business</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {businessLinks.map((link) => (
                  <DropdownMenuItem 
                    key={link.path} 
                    onClick={() => navigate(link.path)} 
                    className="cursor-pointer"
                  >
                    <link.icon className="mr-2 h-4 w-4" />
                    {link.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/messages">
                  <Button variant="ghost" size="icon" className="relative">
                    <Mail className="w-5 h-5" />
                  </Button>
                </Link>
                <ShareLinkModal 
                  trigger={
                    <Button variant="outline" className="gap-2">
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  }
                />
                <Link to={isAdmin ? "/admin" : "/dashboard"}>
                  <Button variant="hero" size="default">
                    Dashboard
                  </Button>
                </Link>
                
                {/* Avatar Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full relative">
                      <Avatar className="w-9 h-9 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {userInitial}
                        </AvatarFallback>
                      </Avatar>
                      <PresenceIndicator isOnline={true} size="sm" className="bottom-0 right-0" />
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
                    <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </DropdownMenuItem>
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
                    {gamificationEnabled && (
                      <DropdownMenuItem onClick={() => navigate("/achievements")} className="cursor-pointer">
                        <Trophy className="mr-2 h-4 w-4" />
                        Achievements
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-destructive">Admin</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate("/admin-settings")} className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Settings
                        </DropdownMenuItem>
                      </>
                    )}
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
            className="md:hidden p-3 -mr-2 rounded-xl hover:bg-accent active:scale-95 transition-all duration-200 touch-manipulation"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            <div className="relative w-6 h-6">
              <Menu className={`w-6 h-6 absolute inset-0 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
              <X className={`w-6 h-6 absolute inset-0 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}`} />
            </div>
          </button>
        </div>
      </div>
    </nav>

    {/* Mobile Menu Overlay */}
    <div 
      className={`md:hidden fixed inset-0 z-[105] bg-black/50 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      onClick={() => setMobileMenuOpen(false)}
    />
    
    {/* Mobile Menu Panel */}
    <div className={`md:hidden fixed inset-x-0 top-16 bottom-0 z-[110] bg-background border-t border-border overflow-y-auto overscroll-contain transition-all duration-300 ease-out ${mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
      <div className="flex flex-col gap-1 py-4 px-4 max-w-7xl mx-auto">
            {navLinks.map((link, index) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`animate-fade-in ${mobileMenuOpen ? '' : 'opacity-0'}`}
              >
                <Button
                  variant="ghost"
                  className={`w-full justify-start h-12 text-base ${link.icon ? "gap-3" : ""} ${isActive(link.path) ? "bg-accent" : ""} active:scale-[0.98] transition-transform touch-manipulation`}
                >
                  {link.icon && <link.icon className="w-5 h-5" />}
                  {link.label}
                </Button>
              </Link>
            ))}
              
              <div className="px-4 py-3 mt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Features</p>
              </div>
              
              {featureLinks.map((link, index) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ animationDelay: `${(navLinks.length + index) * 40}ms` }}
                  className={`animate-fade-in ${mobileMenuOpen ? '' : 'opacity-0'}`}
                >
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-11 ${isActive(link.path) ? "bg-accent" : ""} active:scale-[0.98] transition-transform touch-manipulation`}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Button>
                </Link>
              ))}
              
              <div className="px-4 py-3 mt-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business</p>
              </div>
              
              {businessLinks.map((link, index) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ animationDelay: `${(navLinks.length + featureLinks.length + index) * 40}ms` }}
                  className={`animate-fade-in ${mobileMenuOpen ? '' : 'opacity-0'}`}
                >
                  <Button
                    variant="ghost"
                    className={`w-full justify-start gap-3 h-11 ${isActive(link.path) ? "bg-accent" : ""} active:scale-[0.98] transition-transform touch-manipulation`}
                  >
                    <link.icon className="w-5 h-5" />
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
                      <div className="relative">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                          <AvatarFallback className="bg-primary/10 text-primary font-medium">
                            {userInitial}
                          </AvatarFallback>
                        </Avatar>
                        <PresenceIndicator isOnline={true} size="sm" className="bottom-0 right-0" />
                      </div>
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
                  <Link to={isAdmin ? "/admin" : "/dashboard"} onClick={() => setMobileMenuOpen(false)}>
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
    </>


  );
});

Navbar.displayName = "Navbar";

export default Navbar;
