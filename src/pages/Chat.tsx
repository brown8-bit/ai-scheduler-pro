import Navbar from "@/components/Navbar";
import AIChatBox from "@/components/AIChatBox";
import { Sparkles } from "lucide-react";

const Chat = () => {
  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-8 sm:pb-12 px-3 sm:px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              AI-Powered Assistant
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold">Your AI Scheduler</h1>
            <p className="text-sm sm:text-lg text-muted-foreground mt-2">
              Just tell me what you need to schedule. I'll handle the rest.
            </p>
          </div>

          {/* Chat Box */}
          <div className="flex justify-center animate-slide-up delay-100">
            <AIChatBox />
          </div>

          {/* Suggestions */}
          <div className="mt-6 sm:mt-8 text-center animate-fade-in delay-300">
            <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">Try asking:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Schedule a meeting tomorrow",
                "Remind me to call mom",
                "Block time for focus",
                "Weekly team standup"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-secondary text-secondary-foreground text-xs sm:text-sm hover:bg-secondary/80 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;
