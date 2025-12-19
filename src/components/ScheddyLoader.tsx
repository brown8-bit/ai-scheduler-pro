import scheddyAvatar from "@/assets/scheddy-avatar.svg";

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
    <div className="flex flex-col items-center justify-center gap-6">
      {/* Scheddy Avatar with animations */}
      <div className="relative">
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        
        {/* Rotating ring */}
        <div className="absolute -inset-3 rounded-full border-4 border-transparent border-t-primary border-r-primary/50 animate-spin" />
        
        {/* Scheddy avatar */}
        <img
          src={scheddyAvatar}
          alt="Scheddy loading"
          className="w-20 h-20 rounded-full shadow-elegant animate-bounce-slow relative z-10"
        />
      </div>

      {/* Loading text */}
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-foreground animate-pulse">
          {randomPhrase}
        </p>
        <div className="flex items-center justify-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
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
