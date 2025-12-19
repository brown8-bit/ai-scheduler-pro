import { Link } from "react-router-dom";
import { forwardRef } from "react";
import { Shield } from "lucide-react";
import scheddyModern from "@/assets/scheddy-modern.png";

const Footer = forwardRef<HTMLElement>((_, ref) => {
  return (
    <footer ref={ref} className="bg-secondary/50 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Privacy Banner */}
        <div className="mb-8 p-4 rounded-xl bg-green-500/5 border border-green-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-sm">Your data is encrypted and private</p>
              <p className="text-xs text-muted-foreground">We never sell or share your information</p>
            </div>
          </div>
          <Link 
            to="/privacy" 
            className="text-sm text-green-600 dark:text-green-400 hover:underline font-medium"
          >
            Privacy Policy →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-primary/20">
                <img src={scheddyModern} alt="Scheddy" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-lg sm:text-xl">Schedulr</span>
            </Link>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md">
              Meet Scheddy, your AI-powered scheduling assistant. Book meetings, set reminders, and manage your time effortlessly.
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
          <p className="text-xs mt-2 text-muted-foreground/70">
            Built with privacy in mind. All data use is opt-in only.
          </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
