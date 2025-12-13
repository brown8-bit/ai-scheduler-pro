import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, Check, ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <>
      <Helmet>
        <title>Install Schedulr | Get the App</title>
        <meta name="description" content="Install Schedulr on your device for the best experience." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="p-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-lg mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-elegant">
              <Smartphone className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Install Schedulr</h1>
            <p className="text-muted-foreground">
              Get the full app experience on your device
            </p>
          </div>

          {isInstalled ? (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
              <Check className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
                Already Installed!
              </h2>
              <p className="text-green-700 dark:text-green-300">
                Schedulr is installed on your device. Look for it on your home screen.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Benefits */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                <h2 className="font-semibold text-lg mb-4">Why install?</h2>
                <ul className="space-y-3">
                  {[
                    "Works offline — access your schedule anywhere",
                    "Faster loading — instant app experience",
                    "Home screen access — launch with one tap",
                    "Full screen — no browser UI distractions",
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Install Instructions */}
              {isIOS ? (
                <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                  <h2 className="font-semibold text-lg mb-4">How to install on iPhone/iPad</h2>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">1</span>
                      <span className="text-muted-foreground">
                        Tap the <strong className="text-foreground">Share</strong> button in Safari (the square with an arrow)
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">2</span>
                      <span className="text-muted-foreground">
                        Scroll down and tap <strong className="text-foreground">"Add to Home Screen"</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">3</span>
                      <span className="text-muted-foreground">
                        Tap <strong className="text-foreground">"Add"</strong> to confirm
                      </span>
                    </li>
                  </ol>
                </div>
              ) : deferredPrompt ? (
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleInstall}
                >
                  <Download className="w-5 h-5" />
                  Install Schedulr
                </Button>
              ) : (
                <div className="bg-card rounded-xl border border-border p-6 shadow-card">
                  <h2 className="font-semibold text-lg mb-4">How to install on Android</h2>
                  <ol className="space-y-4">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">1</span>
                      <span className="text-muted-foreground">
                        Tap the <strong className="text-foreground">menu</strong> button (three dots) in Chrome
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">2</span>
                      <span className="text-muted-foreground">
                        Tap <strong className="text-foreground">"Install app"</strong> or <strong className="text-foreground">"Add to Home screen"</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm flex items-center justify-center flex-shrink-0">3</span>
                      <span className="text-muted-foreground">
                        Follow the prompts to install
                      </span>
                    </li>
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Install;
