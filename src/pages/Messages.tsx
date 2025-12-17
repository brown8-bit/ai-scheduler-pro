import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarWithPresence } from "@/components/AvatarWithPresence";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Search,
  Loader2,
  Check,
  CheckCheck,
} from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  updated_at: string;
  other_user: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
    is_read: boolean;
  };
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check for userId param to start new conversation
  useEffect(() => {
    const targetUserId = searchParams.get("userId");
    if (targetUserId && user) {
      startConversation(targetUserId);
    }
  }, [searchParams, user]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Real-time messages subscription
  useEffect(() => {
    if (!selectedConversation || !user) return;

    const channel = supabase
      .channel(`messages-${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        (payload) => {
          console.log('New message:', payload);
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          
          // Mark as read if not sender
          if (newMsg.sender_id !== user.id) {
            markMessagesAsRead(selectedConversation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation, user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Get all conversations for user
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (!participants?.length) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const conversationIds = participants.map(p => p.conversation_id);

      // Get conversation details with other participants
      const { data: allParticipants } = await supabase
        .from("conversation_participants")
        .select("*")
        .in("conversation_id", conversationIds);

      // Get profiles for other users
      const otherUserIds = allParticipants
        ?.filter(p => p.user_id !== user.id)
        .map(p => p.user_id) || [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, is_verified")
        .in("user_id", otherUserIds);

      // Get last message for each conversation
      const conversationsWithDetails: Conversation[] = [];

      for (const convId of conversationIds) {
        const otherParticipant = allParticipants?.find(
          p => p.conversation_id === convId && p.user_id !== user.id
        );

        if (!otherParticipant) continue;

        const profile = profiles?.find(p => p.user_id === otherParticipant.user_id);

        const { data: lastMsg } = await supabase
          .from("direct_messages")
          .select("*")
          .eq("conversation_id", convId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        const { count: unreadCount } = await supabase
          .from("direct_messages")
          .select("*", { count: 'exact', head: true })
          .eq("conversation_id", convId)
          .eq("is_read", false)
          .neq("sender_id", user.id);

        conversationsWithDetails.push({
          id: convId,
          updated_at: lastMsg?.created_at || otherParticipant.joined_at,
          other_user: {
            user_id: otherParticipant.user_id,
            display_name: profile?.display_name || "User",
            avatar_url: profile?.avatar_url,
            is_verified: profile?.is_verified || false,
          },
          last_message: lastMsg,
          unread_count: unreadCount || 0,
        });
      }

      // Sort by most recent
      conversationsWithDetails.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const startConversation = async (otherUserId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc("get_or_create_conversation", {
        other_user_id: otherUserId,
      });

      if (error) throw error;

      setSelectedConversation(data);
      await fetchConversations();
      await fetchMessages(data);
      await fetchOtherUserProfile(otherUserId);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return;
    }

    setMessages(data || []);
    markMessagesAsRead(conversationId);
  };

  const fetchOtherUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, is_verified")
      .eq("user_id", userId)
      .single();

    setOtherUserProfile(data);
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!user) return;

    await supabase
      .from("direct_messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", user.id)
      .eq("is_read", false);

    // Update local state
    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      )
    );
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation.id);
    setOtherUserProfile(conversation.other_user);
    await fetchMessages(conversation.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      const { error } = await supabase.from("direct_messages").insert({
        conversation_id: selectedConversation,
        sender_id: user.id,
        content: messageContent,
      });

      if (error) throw error;

      // Update conversation in list
      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      setNewMessage(messageContent);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.other_user.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-20 pb-8">
        <div className="max-w-5xl mx-auto">
          <Card className="overflow-hidden h-[calc(100vh-8rem)]">
            <div className="flex h-full">
              {/* Conversations List */}
              <div
                className={cn(
                  "w-full md:w-80 border-r flex flex-col",
                  selectedConversation && "hidden md:flex"
                )}
              >
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    Messages
                  </h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground text-sm">
                        {searchQuery ? "No conversations found" : "No messages yet"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Start a conversation from someone's profile
                      </p>
                    </div>
                  ) : (
                    filteredConversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => handleSelectConversation(conversation)}
                        className={cn(
                          "w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b",
                          selectedConversation === conversation.id && "bg-muted/50"
                        )}
                      >
                        <AvatarWithPresence
                          userId={conversation.other_user.user_id}
                          avatarUrl={conversation.other_user.avatar_url}
                          displayName={conversation.other_user.display_name || "U"}
                          size="lg"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold truncate flex items-center gap-1">
                              {conversation.other_user.display_name}
                              {conversation.other_user.is_verified && (
                                <VerifiedBadge size="sm" />
                              )}
                            </span>
                            {conversation.last_message && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatDistanceToNow(new Date(conversation.last_message.created_at), {
                                  addSuffix: false,
                                })}
                              </span>
                            )}
                          </div>
                          {conversation.last_message && (
                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                              {conversation.last_message.sender_id === user?.id && "You: "}
                              {conversation.last_message.content}
                            </p>
                          )}
                        </div>
                        {conversation.unread_count > 0 && (
                          <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                            {conversation.unread_count}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div
                className={cn(
                  "flex-1 flex flex-col",
                  !selectedConversation && "hidden md:flex"
                )}
              >
                {selectedConversation && otherUserProfile ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <AvatarWithPresence
                        userId={otherUserProfile.user_id}
                        avatarUrl={otherUserProfile.avatar_url}
                        displayName={otherUserProfile.display_name || "U"}
                        size="md"
                      />
                      <div>
                        <p className="font-semibold flex items-center gap-1">
                          {otherUserProfile.display_name || "User"}
                          {otherUserProfile.is_verified && <VerifiedBadge size="sm" />}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{otherUserProfile.display_name?.toLowerCase().replace(/\s/g, '') || "user"}
                        </p>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              message.sender_id === user?.id
                                ? "justify-end"
                                : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] rounded-2xl px-4 py-2",
                                message.sender_id === user?.id
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted rounded-bl-md"
                              )}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <div
                                className={cn(
                                  "flex items-center gap-1 mt-1",
                                  message.sender_id === user?.id
                                    ? "justify-end"
                                    : "justify-start"
                                )}
                              >
                                <span
                                  className={cn(
                                    "text-[10px]",
                                    message.sender_id === user?.id
                                      ? "text-primary-foreground/70"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {formatDistanceToNow(new Date(message.created_at), {
                                    addSuffix: true,
                                  })}
                                </span>
                                {message.sender_id === user?.id && (
                                  message.is_read ? (
                                    <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                                  ) : (
                                    <Check className="w-3 h-3 text-primary-foreground/70" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Input
                          ref={inputRef}
                          placeholder="Type a message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="rounded-full"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() || sending}
                          className="rounded-full"
                          size="icon"
                        >
                          {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                      <p className="text-muted-foreground">
                        Select a conversation to start messaging
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Messages;