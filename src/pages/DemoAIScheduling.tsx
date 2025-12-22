import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Sparkles, ArrowRight, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";
import scheddyAvatar from "@/assets/scheddy-avatar.png";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

const DEMO_RESPONSES: Record<string, { response: string; suggestions?: string[] }> = {
  default: {
    response: "Hi! I'm Scheddy, your AI scheduling assistant. I can help you plan your day, schedule tasks, and block focus time. What would you like to do?",
    suggestions: ["Plan my day", "Schedule a meeting", "Block focus time", "Show my tasks"]
  },
  "plan my day": {
    response: "Great! Let's plan your day. Based on your typical patterns, I suggest:\n\n🌅 **Morning (9-12)**\n- Deep work session: Focus on high-priority tasks\n\n☀️ **Afternoon (1-4)**\n- Meetings and collaborative work\n- Content creation block\n\n🌙 **Evening (5-6)**\n- Wrap up tasks and plan tomorrow\n\nWould you like me to add these to your calendar?",
    suggestions: ["Add to calendar", "Adjust the schedule", "Show alternatives"]
  },
  "schedule a meeting": {
    response: "I can help schedule a meeting! Here are your available slots this week:\n\n📅 **Tomorrow**\n- 10:00 AM - 11:00 AM\n- 2:00 PM - 3:00 PM\n\n📅 **Wednesday**\n- 9:00 AM - 10:00 AM\n- 3:00 PM - 4:00 PM\n\nWho would you like to meet with?",
    suggestions: ["Book 10 AM tomorrow", "Send availability link", "Check next week"]
  },
  "block focus time": {
    response: "Perfect! Focus time is crucial for deep work. I recommend:\n\n🎯 **Daily Focus Block**\n- 9:00 AM - 11:30 AM (2.5 hours)\n- Best for: Creative work, coding, writing\n\n✅ **Settings:**\n- Block notifications\n- Mark as busy in calendar\n- Auto-decline meeting requests\n\nShall I create this focus block?",
    suggestions: ["Create focus block", "Different time", "Weekly schedule"]
  },
  "show my tasks": {
    response: "Here are your current tasks:\n\n🔴 **High Priority**\n- Finish project proposal (Due today)\n- Review team updates\n\n🟡 **Medium Priority**\n- Prepare presentation slides\n- Update documentation\n\n🟢 **Low Priority**\n- Organize files\n- Schedule 1:1 meetings\n\nWould you like me to help prioritize or schedule these?",
    suggestions: ["Prioritize for me", "Schedule all tasks", "Add new task"]
  }
};

const DemoAIScheduling = () => {
  const navigate = useNavigate();
  const { isDemoMode, startDemo } = useDemo();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: DEMO_RESPONSES.default.response,
      suggestions: DEMO_RESPONSES.default.suggestions
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const key = messageText.toLowerCase();
      const response = DEMO_RESPONSES[key] || {
        response: `I understand you want to "${messageText}". In the full version, I can help you with that! For now, try asking me to plan your day, schedule meetings, or block focus time.`,
        suggestions: ["Plan my day", "Schedule a meeting", "Block focus time"]
      };

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        suggestions: response.suggestions
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 500);
  };

  const handleStartFullDemo = () => {
    startDemo();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Demo Banner */}
      {!isDemoMode && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white py-2 px-4">
          <div className="container mx-auto flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm font-medium">
              ✨ You're previewing AI Scheduling — Start a full demo to unlock all features!
            </p>
            <Button size="sm" variant="secondary" onClick={handleStartFullDemo} className="gap-1">
              Start Full Demo <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}

      <main className={`container mx-auto px-4 py-8 ${isDemoMode ? 'pt-24' : 'pt-32'} max-w-4xl`}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Scheduling Assistant
          </h1>
          <p className="text-muted-foreground mt-2">
            Chat with Scheddy to plan your perfect day ✨
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
            <Calendar className="w-3.5 h-3.5" />
            Smart Scheduling
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm">
            <Clock className="w-3.5 h-3.5" />
            Time Blocking
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Task Prioritization
          </div>
        </div>

        {/* Chat Interface */}
        <Card className="h-[500px] flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "assistant" 
                      ? "bg-primary/10" 
                      : "bg-muted"
                  }`}>
                    {message.role === "assistant" ? (
                      <img src={scheddyAvatar} alt="Scheddy" className="w-8 h-8 rounded-full" />
                    ) : (
                      <User className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  {/* Message */}
                  <div className={`max-w-[80%] ${message.role === "user" ? "text-right" : ""}`}>
                    <div className={`inline-block p-3 rounded-2xl ${
                      message.role === "assistant"
                        ? "bg-muted text-foreground rounded-tl-sm"
                        : "bg-primary text-primary-foreground rounded-tr-sm"
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {/* Suggestions */}
                    {message.suggestions && message.role === "assistant" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.suggestions.map((suggestion, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => handleSend(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <img src={scheddyAvatar} alt="Scheddy" className="w-8 h-8 rounded-full" />
                  </div>
                  <div className="bg-muted p-3 rounded-2xl rounded-tl-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Scheddy anything..."
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>

        {/* CTA for full demo */}
        {!isDemoMode && (
          <div className="mt-8 text-center">
            <Card className="p-8 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-blue-500/20">
              <h3 className="text-2xl font-bold mb-2">Experience the Full AI Power</h3>
              <p className="text-muted-foreground mb-6">In the full demo, Scheddy can actually create events, manage your calendar, and sync with your tools!</p>
              <Button size="lg" onClick={handleStartFullDemo} className="gap-2">
                Start Full Demo <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default DemoAIScheduling;
