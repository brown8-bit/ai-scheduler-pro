import { useEffect, useState, useRef, type ChangeEvent, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Settings, 
  User,
  Bell,
  Calendar,
  Moon,
  Sun,
  Save,
  Loader2,
  ArrowLeft,
  Camera,
  CreditCard,
  Crown,
  ExternalLink,
  Check,
  X,
  Heart,
  MessageCircle,
  Repeat2,
  UserPlus,
  Trophy,
  Users,
  Shield,
  Link2,
  BarChart3,
  Zap,
  Target,
  MapPin,
  Play
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useDemo } from "@/contexts/DemoContext";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import NotificationToggle from "@/components/NotificationToggle";
import ImageCropper from "@/components/ImageCropper";
import CalendarConnections from "@/components/CalendarConnections";
import QuickActionsSettings from "@/components/QuickActionsSettings";
import { formatDistanceToNow } from "date-fns";

interface ActivityNotification {
  id: string;
  user_id: string;
  actor_id: string;
  type: 'like' | 'comment' | 'repost' | 'quote' | 'follow';
  post_id: string | null;
  is_read: boolean;
  created_at: string;
  actor_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

const UserSettings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const { setTourActive, setCurrentTourStep } = useDemo();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscription State
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // User Settings State
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [emailReminders, setEmailReminders] = useState(true);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [defaultEventDuration, setDefaultEventDuration] = useState("30");
  const [workdayStart, setWorkdayStart] = useState("09:00");
  const [workdayEnd, setWorkdayEnd] = useState("17:00");
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [nameError, setNameError] = useState<string | null>(null);
  const [gamificationEnabled, setGamificationEnabled] = useState(true);
  // Activity Notifications State
  const [activityNotifications, setActivityNotifications] = useState<ActivityNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [checkingName, setCheckingName] = useState(false);
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);
  const [originalName, setOriginalName] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
    if (user) {
      setDisplayName(user.email?.split("@")[0] || "");
      fetchProfile();
      checkSubscription();
      fetchActivityNotifications();
    }
  }, [user, authLoading, navigate]);

  const fetchActivityNotifications = async () => {
    if (!user) return;
    setNotificationsLoading(true);

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching notifications:', error);
      setNotificationsLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const actorIds = [...new Set(data.map(n => n.actor_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', actorIds);

      const enrichedNotifications = data.map(notification => ({
        ...notification,
        actor_profile: profiles?.find(p => p.user_id === notification.actor_id),
      }));

      setActivityNotifications(enrichedNotifications as ActivityNotification[]);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
    setNotificationsLoading(false);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setActivityNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    toast({ title: "All notifications marked as read" });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      case 'repost':
      case 'quote':
        return <Repeat2 className="h-4 w-4 text-green-500" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationText = (notification: ActivityNotification) => {
    const name = notification.actor_profile?.display_name || 'Someone';
    switch (notification.type) {
      case 'like': return `${name} liked your post`;
      case 'comment': return `${name} commented on your post`;
      case 'repost': return `${name} reposted your post`;
      case 'quote': return `${name} quoted your post`;
      case 'follow': return `${name} started following you`;
      default: return `${name} interacted with your content`;
    }
  };

  const checkSubscription = async () => {
    setSubscriptionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) throw error;
      
      setSubscribed(data?.subscribed || false);
      setProductId(data?.product_id || null);
      setSubscriptionEnd(data?.subscription_end || null);
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Portal error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to open subscription portal.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    
    if (data) {
      const name = data.display_name || user.email?.split("@")[0] || "";
      setDisplayName(name);
      setOriginalName(name);
      setAvatarUrl(data.avatar_url);
      setGamificationEnabled(data.gamification_enabled ?? true);
    }
  };

  // Debounced name availability check
  useEffect(() => {
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Reset states if name is empty or same as original
    if (!displayName.trim() || displayName.trim().toLowerCase() === originalName.toLowerCase()) {
      setNameError(null);
      setNameAvailable(null);
      setCheckingName(false);
      return;
    }

    // Set checking state
    setCheckingName(true);
    setNameAvailable(null);
    setNameError(null);

    // Debounce the check
    debounceRef.current = setTimeout(async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('is_display_name_available', {
          p_display_name: displayName.trim(),
          p_current_user_id: user.id
        });
        
        if (error) throw error;
        
        if (data) {
          setNameAvailable(true);
          setNameError(null);
        } else {
          setNameAvailable(false);
          setNameError("This display name is already taken");
        }
      } catch (error) {
        console.error("Error checking name:", error);
        setNameAvailable(null);
      } finally {
        setCheckingName(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [displayName, originalName, user]);

  const getSubscriptionTier = () => {
    if (!subscribed) return "Free";
    // Check if it's the Pro subscription product
    if (productId === "prod_TbgdfMvDLuAaXY") return "Pro";
    // Check if it's the Lifetime product
    if (productId === "prod_TbgdjToKIvSQ9T") return "Lifetime";
    return "Pro";
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB for initial upload, will compress after crop)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create object URL for cropping
    const imageUrl = URL.createObjectURL(file);
    setImageToCrop(imageUrl);
    setCropperOpen(true);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCroppedImage = async (croppedBlob: Blob) => {
    if (!user) return;
    
    setUploadingAvatar(true);

    try {
      // Create file from blob
      const file = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });
      const fileName = `${user.id}/avatar.jpg`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      // Add cache buster to URL
      const avatarUrlWithCache = `${publicUrl}?t=${Date.now()}`;

      // Upsert profile with new avatar URL
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          avatar_url: avatarUrlWithCache,
          display_name: displayName,
        }, { onConflict: "user_id" });

      if (profileError) throw profileError;

      setAvatarUrl(avatarUrlWithCache);
      toast({
        title: "Avatar updated! 📸",
        description: "Your profile picture has been saved.",
      });
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload avatar.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      // Clean up object URL
      if (imageToCrop) {
        URL.revokeObjectURL(imageToCrop);
        setImageToCrop(null);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Don't allow save if name is taken
    if (nameAvailable === false) {
      toast({
        title: "Name unavailable",
        description: "Please choose a different display name.",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          display_name: displayName.trim(),
          avatar_url: avatarUrl,
          gamification_enabled: gamificationEnabled,
        }, { onConflict: "user_id" });

      if (error) throw error;

      toast({
        title: "Settings saved! ✅",
        description: "Your preferences have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const isDarkMode = theme === "dark";

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />
      
      <main className="pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Customize your experience</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Profile Settings */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile
              </h2>
              <div className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20 cursor-pointer" onClick={handleAvatarClick}>
                      <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                      <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors active:scale-95 touch-manipulation"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                    {/* File input - NO capture attribute to allow photo library on mobile */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-sm font-medium">Profile Picture</p>
                    <p className="text-xs text-muted-foreground">Tap to choose from photo library or take a new photo</p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <div className="relative">
                    <Input 
                      id="displayName" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)} 
                      placeholder="Your name"
                      className={`pr-10 ${nameError ? "border-destructive" : nameAvailable ? "border-green-500" : ""}`}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingName && (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                      {!checkingName && nameAvailable === true && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                      {!checkingName && nameAvailable === false && (
                        <X className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                  </div>
                  {nameError && (
                    <p className="text-sm text-destructive">{nameError}</p>
                  )}
                  {nameAvailable === true && (
                    <p className="text-sm text-green-500">Name is available!</p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input 
                    value={user.email || ""} 
                    disabled 
                    className="bg-secondary/50"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </div>
            </div>

            {/* Subscription Management */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Subscription
              </h2>
              
              {subscriptionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        subscribed ? "gradient-primary" : "bg-muted"
                      }`}>
                        <Crown className={`w-5 h-5 ${subscribed ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="font-semibold">{getSubscriptionTier()} Plan</p>
                        <p className="text-sm text-muted-foreground">
                          {subscribed 
                            ? subscriptionEnd 
                              ? `Renews on ${new Date(subscriptionEnd).toLocaleDateString()}`
                              : "Active subscription"
                            : "Limited features"
                          }
                        </p>
                      </div>
                    </div>
                    {subscribed && (
                      <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                        Active
                      </div>
                    )}
                  </div>

                  {subscribed ? (
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={handleManageSubscription}
                      disabled={portalLoading}
                    >
                      {portalLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4" />
                      )}
                      Manage Subscription
                    </Button>
                  ) : (
                    <Button 
                      variant="hero" 
                      className="w-full gap-2"
                      onClick={() => navigate("/pricing")}
                    >
                      <Crown className="w-4 h-4" />
                      Upgrade to Pro
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Notification Settings */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                Notifications
              </h2>
              <div className="space-y-4">
                {/* Browser Push Notifications */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <Label>Browser Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get reminders for events and deadlines</p>
                  </div>
                  <NotificationToggle />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get notified before events</p>
                  </div>
                  <Switch 
                    checked={emailReminders} 
                    onCheckedChange={setEmailReminders} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Digest</Label>
                    <p className="text-sm text-muted-foreground">Receive a summary of your day each morning</p>
                  </div>
                  <Switch 
                    checked={dailyDigest} 
                    onCheckedChange={setDailyDigest} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sound Notifications</Label>
                    <p className="text-sm text-muted-foreground">Play sounds for alerts</p>
                  </div>
                  <Switch 
                    checked={soundNotifications} 
                    onCheckedChange={setSoundNotifications} 
                  />
                </div>
              </div>
            </div>

            {/* Activity Notifications */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />
                  Activity
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </h2>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                    Mark all read
                  </Button>
                )}
              </div>
              
              {notificationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : activityNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {activityNotifications.map(notification => (
                    <div
                      key={notification.id}
                      onClick={() => {
                        if (notification.post_id) {
                          navigate(`/community?post=${notification.post_id}`);
                        } else if (notification.type === 'follow') {
                          navigate('/community');
                        }
                      }}
                      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-secondary/50 ${!notification.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={notification.actor_profile?.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {notification.actor_profile?.display_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getNotificationIcon(notification.type)}
                          <span className="text-sm">{getNotificationText(notification)}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {!notification.is_read && (
                        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calendar Integrations */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                Calendar Integrations
              </h2>
              <CalendarConnections />
            </div>

            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Calendar Preferences
                </h2>
                <Link to="/booking-settings">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Link2 className="w-4 h-4" />
                    Booking Links
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="defaultDuration">Default Event Duration (minutes)</Label>
                  <Input 
                    id="defaultDuration" 
                    type="number" 
                    value={defaultEventDuration} 
                    onChange={(e) => setDefaultEventDuration(e.target.value)} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="workdayStart">Workday Start</Label>
                    <Input 
                      id="workdayStart" 
                      type="time" 
                      value={workdayStart} 
                      onChange={(e) => setWorkdayStart(e.target.value)} 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="workdayEnd">Workday End</Label>
                    <Input 
                      id="workdayEnd" 
                      type="time" 
                      value={workdayEnd} 
                      onChange={(e) => setWorkdayEnd(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Quick Actions
              </h2>
              <QuickActionsSettings />
            </div>

            {/* Appearance */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {isDarkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                Appearance
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Use dark theme</p>
                </div>
                <Switch 
                  checked={isDarkMode} 
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                />
              </div>
            </div>

            {/* Retake Tour */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Feature Tour
              </h2>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Want a refresher on all the features? Take the guided tour again to discover tips and tricks you might have missed.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => {
                    setCurrentTourStep(0);
                    setTourActive(true);
                    navigate('/dashboard');
                    toast({
                      title: "Tour started! 🎯",
                      description: "Let's explore all the features together.",
                    });
                  }}
                >
                  <Play className="w-4 h-4" />
                  Retake Feature Tour
                </Button>
              </div>
            </div>

            {/* Gamification & Community - renamed to Progress Tracking when enabled */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                {gamificationEnabled ? (
                  <>
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Progress Tracking
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5 text-primary" />
                    Motivation Mode
                  </>
                )}
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable {gamificationEnabled ? "Progress Tracking" : "Motivation Mode"}</Label>
                    <p className="text-sm text-muted-foreground">
                      {gamificationEnabled 
                        ? "Track your productivity with XP, levels & achievements"
                        : "Show XP, leveling, achievements & private leaderboard"
                      }
                    </p>
                  </div>
                  <Switch 
                    checked={gamificationEnabled} 
                    onCheckedChange={setGamificationEnabled} 
                  />
                </div>
                <div className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg space-y-2">
                  <p className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-green-500" />
                    <span>Optional motivation tools — your data is private and never sold.</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>Leaderboard is private — only visible to you, no public competition.</span>
                  </p>
                  {!gamificationEnabled && (
                    <p className="text-muted-foreground/70 pt-1 border-t border-border/50">
                      When disabled, all XP, achievements, leaderboards and community features are hidden.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="w-full gap-2"
              size="lg"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </Button>
          </div>
        </div>
      </main>

      {/* Image Cropper Modal */}
      {imageToCrop && (
        <ImageCropper
          open={cropperOpen}
          onClose={() => {
            setCropperOpen(false);
            if (imageToCrop) {
              URL.revokeObjectURL(imageToCrop);
              setImageToCrop(null);
            }
          }}
          imageSrc={imageToCrop}
          onCropComplete={handleCroppedImage}
          aspectRatio={1}
          cropShape="round"
          title="Crop Profile Picture"
          description="Adjust and crop your profile picture"
        />
      )}
    </div>
  );
};

export default UserSettings;
