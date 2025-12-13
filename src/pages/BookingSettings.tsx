import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Link2, Copy, Check, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";

interface BookingSlot {
  id: string;
  title: string;
  duration_minutes: number;
  available_days: number[];
  start_hour: number;
  end_hour: number;
  is_active: boolean;
  public_slug: string | null;
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
  const [duration, setDuration] = useState(30);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);
  const [availableDays, setAvailableDays] = useState([1, 2, 3, 4, 5]);
  const [isActive, setIsActive] = useState(true);

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
        setDuration(data.duration_minutes);
        setStartHour(data.start_hour);
        setEndHour(data.end_hour);
        setAvailableDays(data.available_days || [1, 2, 3, 4, 5]);
        setIsActive(data.is_active);
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
        duration_minutes: duration,
        start_hour: startHour,
        end_hour: endHour,
        available_days: availableDays,
        is_active: isActive,
        public_slug: slot?.public_slug || generateSlug(),
        host_email: user!.email
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
        <title>Booking Settings | Schedulr</title>
        <meta name="description" content="Configure your public booking page settings." />
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
                  Booking Page
                </h1>
                <p className="text-muted-foreground mt-1">Let others book time with you</p>
              </div>
              <Link to="/dashboard">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
            </div>

            {/* Booking Link */}
            {bookingUrl && (
              <div className="bg-card rounded-xl border border-border p-6 shadow-card mb-6">
                <h2 className="font-semibold mb-3">Your Booking Link</h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bookingUrl}
                    readOnly
                    className="flex-1 bg-secondary rounded-lg px-4 py-2 text-sm"
                  />
                  <Button onClick={copyLink} variant="outline" className="gap-2">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Share this link to let anyone book time on your calendar
                </p>
              </div>
            )}

            {/* Settings Form */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-card">
              <h2 className="font-semibold mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Booking Settings
              </h2>

              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Meeting Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-secondary rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="30 Minute Meeting"
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Duration (minutes)</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-secondary rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>1 hour</option>
                  </select>
                </div>

                {/* Available Days */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Available Days</label>
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

                {/* Hours */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Start Time</label>
                    <select
                      value={startHour}
                      onChange={(e) => setStartHour(Number(e.target.value))}
                      className="w-full bg-secondary rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">End Time</label>
                    <select
                      value={endHour}
                      onChange={(e) => setEndHour(Number(e.target.value))}
                      className="w-full bg-secondary rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>
                          {i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Booking Page Active</p>
                    <p className="text-sm text-muted-foreground">Allow others to book time with you</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      isActive ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        isActive ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
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
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default BookingSettings;
