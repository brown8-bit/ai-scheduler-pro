import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPromptBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches;
    if (isInstalled) return;

    // Check if dismissed recently (24 hours)
    const dismissedAt = localStorage.getItem("install-banner-dismissed");
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < 24 * 60 * 60 * 1000) return;

    // Check if mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Check if iOS
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // For non-iOS, listen for install prompt
    if (!ios) {
      const handler = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        setShowBanner(true);
      };
      window.addEventListener("beforeinstallprompt", handler);
      return () => window.removeEventListener("beforeinstallprompt", handler);
    } else {
      // Show banner for iOS
      setShowBanner(true);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("install-banner-dismissed", Date.now().toString());
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] p-4 bg-primary text-primary-foreground safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className="flex-1">
          <p className="font-semibold text-sm">Install Schedulr</p>
          {isIOS ? (
            <p className="text-xs opacity-90 flex items-center gap-1">
              Tap <Share className="h-3 w-3 inline" /> then "Add to Home Screen"
            </p>
          ) : (
            <p className="text-xs opacity-90">Add to your home screen for quick access</p>
          )}
        </div>
        {!isIOS && deferredPrompt && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleInstall}
            className="shrink-0"
          >
            <Download className="h-4 w-4 mr-1" />
            Install
          </Button>
        )}
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-primary-foreground/10 rounded"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
