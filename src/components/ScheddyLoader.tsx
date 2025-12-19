import scheddyModern from "@/assets/scheddy-modern.png";

const LOADING_PHRASES = [
  "Checking your schedule...",
  "Organizing your day...",
  "Finding the perfect time...",
  "Getting things ready...",
  "Almost there...",
  "Syncing your calendar...",
];

interface ScheddyLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

const ScheddyLoader = ({ message, fullScreen = true }: ScheddyLoaderProps) => {
  const randomPhrase = message || LOADING_PHRASES[Math.floor(Math.random() * LOADING_PHRASES.length)];

  const content = (
    <div className="flex flex-col items-center justify-center gap-8">
      {/* Modern Scheddy Avatar with animations */}
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 blur-xl animate-pulse" />
        
        {/* Rotating gradient border */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-purple-500 to-cyan-500 animate-spin-slow opacity-75" />
        
        {/* Inner background */}
        <div className="absolute inset-0 rounded-full bg-background" />
        
        {/* Scheddy avatar */}
        <div className="relative z-10 w-24 h-24 rounded-full overflow-hidden shadow-2xl border-2 border-background">
          <img
            src={scheddyModern}
            alt="Scheddy loading"
            className="w-full h-full object-cover animate-float"
          />
        </div>

        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-glow" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }}>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-500 shadow-glow" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '2s' }}>
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-500 shadow-glow" />
        </div>
      </div>

      {/* Loading text */}
      <div className="text-center space-y-3">
        <p className="text-lg font-semibold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
          {randomPhrase}
        </p>
        
        {/* Modern loading bar */}
        <div className="w-48 h-1 rounded-full bg-secondary overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-primary via-purple-500 to-cyan-500 animate-loading-bar" />
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="relative z-10">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-12">
      {content}
    </div>
  );
};

export default ScheddyLoader;