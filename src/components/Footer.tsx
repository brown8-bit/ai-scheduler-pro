import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary/50 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg gradient-primary flex items-center justify-center">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg sm:text-xl">Schedulr</span>
            </Link>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md">
              AI-powered scheduling that understands you. Book meetings, set reminders, and manage your time effortlessly.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/chat" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  AI Chat
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/install" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Get the App
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/admin-login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Admin Login
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-border text-center text-muted-foreground">
          <p className="text-sm">© {new Date().getFullYear()} Schedulr. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
