import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, 
  Link2, 
  Copy, 
  Check, 
  Settings, 
  Clock, 
  Calendar,
  MapPin,
  Users,
  Shield,
  ExternalLink,
  QrCode
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import PrivacyBadge from "@/components/PrivacyBadge";

interface BookingSlot {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  available_days: number[];
  start_hour: number;
  end_hour: number;
  is_active: boolean;
  public_slug: string | null;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  location: string | null;
  meeting_type: string;
  timezone: string;
}

const BookingSettings = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [slot, setSlot] = useState<BookingSlot | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [title, setTitle] = useState("30 Minute Meeting");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);
  const [availableDays, setAvailableDays] = useState([1, 2, 3, 4, 5]);
  const [isActive, setIsActive] = useState(true);
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(15);
  const [location, setLocation] = useState("");
  const [meetingType, setMeetingType] = useState("one_on_one");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBookingSlot();
    }
  }, [user]);

  const fetchBookingSlot = async () => {
    try {
      const { data, error } = await supabase
        .from("booking_slots")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSlot(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setDuration(data.duration_minutes);
        setStartHour(data.start_hour);
        setEndHour(data.end_hour);
        setAvailableDays(data.available_days || [1, 2, 3, 4, 5]);
        setIsActive(data.is_active ?? true);
        setBufferBefore(data.buffer_before_minutes || 0);
        setBufferAfter(data.buffer_after_minutes || 15);
        setLocation(data.location || "");
        setMeetingType(data.meeting_type || "one_on_one");
      }
    } catch (error) {
      console.error("Error fetching booking slot:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const generateSlug = () => {
    return `${user!.id.slice(0, 8)}-${Date.now().toString(36)}`;
  };

  const saveBookingSlot = async () => {
    setSaving(true);
    try {
      const slotData = {
        user_id: user!.id,
        title,
        description: description || null,
        duration_minutes: duration,
        start_hour: startHour,
        end_hour: endHour,
        available_days: availableDays,
        is_active: isActive,
        public_slug: slot?.public_slug || generateSlug(),
        host_email: user!.email,
        buffer_before_minutes: bufferBefore,
        buffer_after_minutes: bufferAfter,
        location: location || null,
        meeting_type: meetingType,
      };

      if (slot) {
        const { error } = await supabase
          .from("booking_slots")
          .update(slotData)
          .eq("id", slot.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("booking_slots")
          .insert(slotData)
          .select()
          .single();
        if (error) throw error;
        setSlot(data);
      }

      toast({
        title: "Settings saved! ✅",
        description: "Your booking page has been updated.",
      });

      fetchBookingSlot();
    } catch (error) {
      console.error("Error saving booking slot:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    if (slot?.public_slug) {
      const url = `${window.location.origin}/book/${slot.public_slug}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied! 📋",
        description: "Share this link to let others book time with you.",
      });
    }
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const toggleDay = (day: number) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter(d => d !== day));
    } else {
      setAvailableDays([...availableDays, day].sort());
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const bookingUrl = slot?.public_slug ? `${window.location.origin}/book/${slot.public_slug}` : null;

  return (
    <>
      <Helmet>
        <title>Booking Links | Schedulr</title>
        <meta name="description" content="Create and manage your public booking page — let others schedule time with you easily." />
      </Helmet>

      <div className="min-h-screen bg-secondary/30">
        <Navbar />

        <main className="pt-24 pb-12 px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Link2 className="w-8 h-8 text-primary" />
                  Booking Links
                </h1>
                <p className="text-muted-foreground mt-1">Let others book time with you — like Calendly</p>
              </div>
              <Link to="/settings">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
            </div>

            {/* Booking Link Card */}
            {bookingUrl && (
              <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl border border-primary/20 p-6 shadow-card mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-lg">Your Booking Link</h2>
                    <p className="text-sm text-muted-foreground">Share this link to let anyone book time on your calendar</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-500/10 text-green-600 rounded-full">Active</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-red-500/10 text-red-600 rounded-full">Inactive</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={bookingUrl}
                    readOnly
                    className="flex-1 bg-background/80 rounded-lg px-4 py-3 text-sm border border-border"
                  />
                  <Button onClick={copyLink} variant="default" className="gap-2">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => window.open(bookingUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Preview Page
                  </Button>
                </div>
              </div>
            )}

            {/* Settings Form */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-6">
              <h2 className="font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Booking Settings
              </h2>

              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="30 Minute Meeting"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this meeting about?"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location / Meeting Link (optional)</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Zoom link, office address, or 'TBD'"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Duration & Buffers */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duration & Buffers
                </h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Duration</Label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full mt-1 bg-secondary rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                      <option value={45}>45 min</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                    </select>
                  </div>
                  <div>
                    <Label>Buffer Before</Label>
                    <select
                      value={bufferBefore}
                      onChange={(e) => setBufferBefore(Number(e.target.value))}
                      className="w-full mt-1 bg-secondary rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value={0}>None</option>
                      <option value={5}>5 min</option>
                      <option value={10}>10 min</option>
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                    </select>
                  </div>
                  <div>
                    <Label>Buffer After</Label>
                    <select
                      value={bufferAfter}
                      onChange={(e) => setBufferAfter(Number(e.target.value))}
                      className="w-full mt-1 bg-secondary rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value={0}>None</option>
                      <option value={5}>5 min</option>
                      <option value={10}>10 min</option>
                      <option value={15}>15 min</option>
                      <option value={30}>30 min</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Availability
                </h3>

                <div>
                  <Label className="mb-2 block">Available Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {dayNames.map((name, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleDay(index)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          availableDays.includes(index)
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <select
                      value={startHour}
                      onChange={(e) => setStartHour(Number(e.target.value))}
                      className="w-full mt-1 bg-secondary rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <select
                      value={endHour}
                      onChange={(e) => setEndHour(Number(e.target.value))}
                      className="w-full mt-1 bg-secondary rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="font-medium">Booking Page Active</p>
                  <p className="text-sm text-muted-foreground">Allow others to book time with you</p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              <Button
                onClick={saveBookingSlot}
                variant="hero"
                size="lg"
                className="w-full"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>

            {/* Privacy Note */}
            <div className="mt-6">
              <PrivacyBadge variant="compact" />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default BookingSettings;
