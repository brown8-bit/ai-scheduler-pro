import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Loader2, Camera, ImageIcon, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

interface AIChatBoxProps {
  onEventCreated?: () => void;
}

const AIChatBox = ({ onEventCreated }: AIChatBoxProps) => {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm Lawrence, your AI scheduling assistant. 👋 What would you like to schedule today? You can also attach photos to your events!" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          userId: user?.id || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
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
        toast({
          title: "Event Created! 🎉",
          description: `"${data.event.title}" has been added to your calendar.`,
        });
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

  return (
    <div className="w-full max-w-3xl bg-card rounded-2xl shadow-card border border-border overflow-hidden">
      {/* Chat Header */}
      <div className="p-3 sm:p-4 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm sm:text-base">Lawrence</h3>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {user ? "Ready to schedule for you" : "Sign in to save events"}
            </p>
          </div>
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
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === "user" ? "bg-primary" : "gradient-primary"
              }`}
            >
              {message.role === "user" ? (
                <User className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
              ) : (
                <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
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
        {isLoading && (
          <div className="flex gap-2 sm:gap-3 animate-fade-in">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full gradient-primary flex items-center justify-center">
              <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-primary-foreground" />
            </div>
            <div className="bg-secondary p-2.5 sm:p-3 rounded-2xl rounded-bl-md">
              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-muted-foreground" />
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
        
        <div className="flex gap-2 sm:gap-3">
          {/* Photo Buttons */}
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
            placeholder={user ? "What do you want to schedule?" : "Sign in to save events..."}
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
