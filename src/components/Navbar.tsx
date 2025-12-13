import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Menu, X } from "lucide-react";
import { useState } from "react";

const Navbar = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <Link to="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/register">
              <Button variant="hero" size="default">
                Get Started
              </Button>
            </Link>
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
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
