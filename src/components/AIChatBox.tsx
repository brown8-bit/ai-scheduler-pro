import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Send, User, Loader2, Camera, ImageIcon, X, Sparkles, LogIn, Mic, MicOff, Zap } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import scheddyAvatar from "@/assets/scheddy-modern.png";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useQuickActions } from "@/hooks/useQuickActions";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

// Guest credits system
const GUEST_CREDITS_KEY = "schedulr_guest_credits";
const INITIAL_GUEST_CREDITS = 350;

const getGuestCredits = (): number => {
  const stored = localStorage.getItem(GUEST_CREDITS_KEY);
  if (stored === null) {
    localStorage.setItem(GUEST_CREDITS_KEY, String(INITIAL_GUEST_CREDITS));
    return INITIAL_GUEST_CREDITS;
  }
  return parseInt(stored, 10);
};

const decrementGuestCredits = (): number => {
  const current = getGuestCredits();
  const newValue = Math.max(0, current - 1);
  localStorage.setItem(GUEST_CREDITS_KEY, String(newValue));
  return newValue;
};

// Scheddy's personality phrases - more natural and varied
const SCHEDDY_GREETINGS = [
  "Hey there! 👋 I'm Scheddy - your personal scheduling sidekick. What's on your mind today?",
  "Oh hi! Ready to help you conquer your schedule. What would you like to organize?",
  "Hey! Scheddy here. Whether it's a quick reminder or a complex recurring event, I've got you. What do you need?",
  "Hello! 🗓️ I'm basically obsessed with helping people get organized. What can I help you schedule?",
  "Hey friend! Tell me what's on your plate and let's get it organized together.",
  "Hi! I'm Scheddy, and honestly? Helping with schedules is my favorite thing. What's up?",
  "Hey! Got meetings to schedule? Reminders to set? Focus time to block? I'm your assistant!",
];

const SCHEDDY_STATUS_PHRASES = [
  "Ready to help! ✨",
  "Let's get organized",
  "At your service",
  "Feeling productive",
  "Schedule mode: ON",
  "Here for you",
];

const LOADING_MESSAGES = [
  "Let me think about that...",
  "Checking your schedule...",
  "Finding the perfect time...",
  "Working on it...",
  "Almost there...",
  "One moment...",
];

const EVENT_CREATED_PHRASES = [
  "Done! 💥",
  "Scheduled! ✨",
  "Got it! 🎯",
  "Locked in! 🔒",
  "All set! 🌟",
  "Ta-da! 🎉",
  "Perfect! ✅",
  "On your calendar! 🚀"
];

const SUGGESTION_PROMPTS = [
  "Schedule a meeting tomorrow at 2pm",
  "Remind me to call mom on Sunday",
  "Block 2 hours for focus time",
  "Add a weekly team standup",
  "What's on my schedule today?",
];

interface AIChatBoxProps {
  onEventCreated?: () => void;
}

const AIChatBox = ({ onEventCreated }: AIChatBoxProps) => {
  const { user } = useAuth();
  const { quickActions } = useQuickActions();
  const [input, setInput] = useState("");
  const [statusPhrase] = useState(() => 
    SCHEDDY_STATUS_PHRASES[Math.floor(Math.random() * SCHEDDY_STATUS_PHRASES.length)]
  );
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: "assistant", content: SCHEDDY_GREETINGS[Math.floor(Math.random() * SCHEDDY_GREETINGS.length)] }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [guestCredits, setGuestCredits] = useState(() => getGuestCredits());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const loadingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Voice input hook
  const handleVoiceTranscript = useCallback((transcript: string) => {
    setInput(prev => prev ? `${prev} ${transcript}` : transcript);
    toast({
      title: "Got it! 🎤",
      description: "Your voice has been transcribed.",
    });
  }, []);

  const { isListening, isSupported: isVoiceSupported, toggleListening } = useVoiceInput({
    onTranscript: handleVoiceTranscript,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cycle through loading messages
  useEffect(() => {
    if (isLoading) {
      let index = 0;
      setLoadingMessage(LOADING_MESSAGES[0]);
      loadingIntervalRef.current = setInterval(() => {
        index = (index + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[index]);
      }, 2000);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    }
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
      }
    };
  }, [isLoading]);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setAttachedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAttachedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    toast({
      title: "Photo attached! 📸",
      description: "Your photo will be included with your message.",
    });
  };

  const clearAttachment = () => {
    setAttachedImage(null);
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || isLoading) return;

    // Check guest credits
    if (!user && guestCredits <= 0) {
      toast({
        title: "Credits exhausted",
        description: "Sign up for free to continue using Scheddy!",
        variant: "destructive",
      });
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "You've used all your free credits! 🎉 Sign up for a free account to keep chatting with me and save your events." 
      }]);
      return;
    }

    const userMessage: Message = { 
      role: "user", 
      content: input || (attachedImage ? "📷 [Photo attached]" : ""),
      image: attachedImage || undefined
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    clearAttachment();
    setIsLoading(true);

    // Decrement guest credits before sending
    if (!user) {
      const remaining = decrementGuestCredits();
      setGuestCredits(remaining);
    }

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userId: user?.id || null,
          isGuest: !user
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          // Check if it's a usage limit error
          if (errorData.limit_reached) {
            toast({
              title: "Monthly Limit Reached",
              description: errorData.error || "Upgrade to Pro for more AI requests!",
              variant: "destructive",
            });
            setMessages(prev => [...prev, { 
              role: "assistant", 
              content: `I'd love to help, but you've used all ${errorData.limit} AI requests for this month! 😅 Upgrade to Pro for 100 requests/month, or go Lifetime for unlimited access. 🚀` 
            }]);
            return;
          }
          throw new Error(errorData.error || "Rate limit exceeded. Please wait a moment.");
        }
        if (response.status === 402) {
          throw new Error(errorData.error || "AI credits exhausted.");
        }
        throw new Error(errorData.error || "Failed to get response");
      }

      const data = await response.json();
      
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      
      // If an event was created, notify parent
      if (data.event && onEventCreated) {
        onEventCreated();
        const randomPhrase = EVENT_CREATED_PHRASES[Math.floor(Math.random() * EVENT_CREATED_PHRASES.length)];
        toast({
          title: randomPhrase,
          description: `"${data.event.title}" has been added to your calendar.`,
        });
      }

      // Show signup prompt after several messages for guests
      if (!user && messages.length >= 6) {
        setShowSignupPrompt(true);
      }

    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Oops!",
        description: error instanceof Error ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  

  const isLowCredits = !user && guestCredits > 0 && guestCredits <= 50;

  return (
    <div className="w-full max-w-3xl bg-card rounded-2xl shadow-card border border-border overflow-hidden">
      {/* Low Credits Warning */}
      {isLowCredits && (
        <div className="px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-2">
          <p className="text-xs text-amber-600 dark:text-amber-400">
            ⚠️ Only {guestCredits} credits left! Sign up to continue using Scheddy.
          </p>
          <Link to="/register">
            <Button size="sm" variant="outline" className="text-xs h-7 border-amber-500/30 hover:bg-amber-500/10">
              Sign up
            </Button>
          </Link>
        </div>
      )}

      {/* Chat Header */}
      <div className="p-3 sm:p-4 border-b border-border bg-secondary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/20">
              <img src={scheddyAvatar} alt="Scheddy" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base">Scheddy</h3>
              <p className={`text-xs sm:text-sm truncate ${isLowCredits ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                {user ? statusPhrase : `${guestCredits} credits remaining`}
              </p>
            </div>
          </div>
          {!user && !isLowCredits && (
            <Link to="/register">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <LogIn className="w-3.5 h-3.5" />
                Sign up
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="h-[50vh] sm:h-96 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex gap-2 sm:gap-3 animate-fade-in ${
              message.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${
                message.role === "user" ? "bg-primary" : "border-2 border-primary/20"
              }`}
            >
              {message.role === "user" ? (
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
              ) : (
                <img src={scheddyAvatar} alt="Scheddy" className="w-full h-full object-cover" />
              )}
            </div>
            <div
              className={`max-w-[85%] sm:max-w-[80%] p-2.5 sm:p-3 rounded-2xl ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary text-secondary-foreground rounded-bl-md"
              }`}
            >
              {message.image && (
                <img 
                  src={message.image} 
                  alt="Attached" 
                  className="w-full max-w-[200px] rounded-lg mb-2"
                />
              )}
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        
        {/* Loading State with Friendly Message */}
        {isLoading && (
          <div className="flex gap-2 sm:gap-3 animate-fade-in">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-primary/20">
              <img src={scheddyAvatar} alt="Scheddy" className="w-full h-full object-cover" />
            </div>
            <div className="bg-secondary p-2.5 sm:p-3 rounded-2xl rounded-bl-md">
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-primary" />
                <span className="text-xs sm:text-sm text-muted-foreground animate-pulse">
                  {loadingMessage}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Signup Prompt for Guests */}
        {showSignupPrompt && !user && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Enjoying Scheddy?</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Sign up for free to save your events, track habits, and get unlimited AI scheduling!
                </p>
                <div className="flex gap-2 mt-3">
                  <Link to="/register">
                    <Button size="sm" variant="hero" className="text-xs">
                      Sign up free
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="sm" variant="outline" className="text-xs">
                      Log in
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Suggestion Chips - Show when only initial greeting exists */}
        {messages.length === 1 && !isLoading && (
          <div className="mt-4 animate-fade-in">
            <p className="text-xs text-muted-foreground mb-2">Try saying:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTION_PROMPTS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1.5 text-xs rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border hover:border-primary/50 transition-all duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-border bg-background">
        {/* Attached Image Preview */}
        {attachedImage && (
          <div className="mb-3 relative inline-block">
            <img 
              src={attachedImage} 
              alt="Attached" 
              className="h-16 rounded-lg border border-border"
            />
            <button
              onClick={clearAttachment}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div className="mb-3 flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={() => setInput(action.prompt)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border hover:border-primary/50 transition-all duration-200 disabled:opacity-50"
            >
              <span>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
        
        <div className="flex gap-2 sm:gap-3">
          {/* Photo & Voice Buttons */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 sm:h-11 sm:w-11"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isLoading}
              title="Take Photo"
            >
              <Camera className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 sm:h-11 sm:w-11"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="Photo Library"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            {isVoiceSupported && (
              <Button
                variant={isListening ? "destructive" : "ghost"}
                size="icon"
                className={`h-10 w-10 sm:h-11 sm:w-11 transition-all ${isListening ? "animate-pulse" : ""}`}
                onClick={toggleListening}
                disabled={isLoading}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
          </div>
          
          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={user ? "What do you want to schedule?" : "Try asking anything..."}
            className="flex-1 bg-secondary rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={(!input.trim() && !attachedImage) || isLoading}
            variant="hero"
            size="default"
            className="px-4 sm:px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChatBox;
