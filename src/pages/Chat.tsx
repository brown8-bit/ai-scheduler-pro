import Navbar from "@/components/Navbar";
import AIChatBox from "@/components/AIChatBox";
import { Sparkles } from "lucide-react";

const Chat = () => {
  return (
    <div className="min-h-screen gradient-hero">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              AI-Powered Assistant
            </div>
            <h1 className="text-4xl font-bold">Your AI Scheduler</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Just tell me what you need to schedule. I'll handle the rest.
            </p>
          </div>

          {/* Chat Box */}
          <div className="flex justify-center animate-slide-up delay-100">
            <AIChatBox />
          </div>

          {/* Suggestions */}
          <div className="mt-8 text-center animate-fade-in delay-300">
            <p className="text-sm text-muted-foreground mb-4">Try asking:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Schedule a meeting tomorrow at 2pm",
                "Remind me to call mom on Friday",
                "Block time for deep work",
                "Set up a weekly team standup"
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
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
