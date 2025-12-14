import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Menu, X, Share2, LogOut, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import ShareLinkModal from "@/components/ShareLinkModal";
import { toast } from "@/hooks/use-toast";

const Navbar = () => {
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
    { path: "/templates", label: "Templates" },
    { path: "/focus", label: "Focus" },
    { path: "/achievements", label: "Achievements" },
  ];

  const userInitial = displayName.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-elegant group-hover:shadow-lg transition-shadow">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
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
                <Link to="/settings">
                  <Avatar className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    <AvatarImage src={avatarUrl || undefined} alt={displayName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleSignOut} title="Log out">
                  <LogOut className="w-4 h-4" />
                </Button>
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
};

export default Navbar;
