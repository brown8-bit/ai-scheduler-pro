import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Check, User, Mail, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { format, addDays, startOfDay, isSameDay } from "date-fns";

interface BookingSlot {
  id: string;
  user_id: string;
  title: string;
  duration_minutes: number;
  available_days: number[];
  start_hour: number;
  end_hour: number;
}

const BookPage = () => {
  const { slug } = useParams();
  const [slot, setSlot] = useState<BookingSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState<"date" | "time" | "details" | "confirmed">("date");
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchBookingSlot();
  }, [slug]);

  const fetchBookingSlot = async () => {
    try {
      const { data, error } = await supabase
        .from("booking_slots")
        .select("*")
        .eq("public_slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      setSlot(data);
    } catch (error) {
      console.error("Error fetching booking slot:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableDates = () => {
    if (!slot) return [];
    const dates: Date[] = [];
    const today = startOfDay(new Date());

    for (let i = 1; i <= 30; i++) {
      const date = addDays(today, i);
      const dayOfWeek = date.getDay();
      if (slot.available_days.includes(dayOfWeek)) {
        dates.push(date);
      }
    }

    return dates.slice(0, 14); // Show 2 weeks
  };

  const getAvailableTimeSlots = () => {
    if (!slot) return [];
    const slots: string[] = [];

    for (let hour = slot.start_hour; hour < slot.end_hour; hour++) {
      slots.push(`${hour.toString().padStart(2, "0")}:00`);
      if (hour + 0.5 < slot.end_hour) {
        slots.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }

    return slots;
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const handleSubmit = async () => {
    if (!slot || !selectedDate || !selectedTime || !guestName || !guestEmail) return;

    setSubmitting(true);
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      
      const { error } = await supabase.from("bookings").insert({
        slot_id: slot.id,
        host_user_id: slot.user_id,
        guest_name: guestName,
        guest_email: guestEmail,
        booking_date: format(selectedDate, "yyyy-MM-dd"),
        booking_time: selectedTime,
        notes: notes || null,
      });

      if (error) throw error;

      setStep("confirmed");
      toast({
        title: "Booking confirmed! 🎉",
        description: "You'll receive a confirmation email shortly.",
      });
    } catch (error) {
      console.error("Error creating booking:", error);
      toast({
        title: "Booking failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!slot) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-2">Booking Page Not Found</h1>
        <p className="text-muted-foreground mb-6">This booking link may be invalid or inactive.</p>
        <Link to="/">
          <Button variant="outline">Go to Homepage</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Book a {slot.title} | Schedulr</title>
        <meta name="description" content={`Book a ${slot.duration_minutes} minute meeting`} />
      </Helmet>

      <div className="min-h-screen bg-secondary/30 py-12 px-4">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-elegant">
              <Calendar className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">{slot.title}</h1>
            <p className="text-muted-foreground flex items-center justify-center gap-2 mt-2">
              <Clock className="w-4 h-4" />
              {slot.duration_minutes} minutes
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-card">
            {step === "date" && (
              <>
                <h2 className="font-semibold mb-4">Select a Date</h2>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {getAvailableDates().map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => {
                        setSelectedDate(date);
                        setStep("time");
                      }}
                      className={`p-3 rounded-lg text-center transition-colors ${
                        selectedDate && isSameDay(date, selectedDate)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      <div className="text-xs text-muted-foreground">{format(date, "EEE")}</div>
                      <div className="font-semibold">{format(date, "d")}</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === "time" && (
              <>
                <button
                  onClick={() => setStep("date")}
                  className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to dates
                </button>
                <h2 className="font-semibold mb-2">
                  {selectedDate && format(selectedDate, "EEEE, MMMM d")}
                </h2>
                <p className="text-sm text-muted-foreground mb-4">Select a time</p>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {getAvailableTimeSlots().map((time) => (
                    <button
                      key={time}
                      onClick={() => {
                        setSelectedTime(time);
                        setStep("details");
                      }}
                      className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                        selectedTime === time
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80"
                      }`}
                    >
                      {formatTime(time)}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === "details" && (
              <>
                <button
                  onClick={() => setStep("time")}
                  className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to times
                </button>
                <h2 className="font-semibold mb-2">Your Details</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedDate && format(selectedDate, "EEEE, MMMM d")} at {selectedTime && formatTime(selectedTime)}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Anything you'd like to discuss?"
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-secondary focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    variant="hero"
                    size="lg"
                    className="w-full"
                    disabled={!guestName || !guestEmail || submitting}
                  >
                    {submitting ? "Booking..." : "Confirm Booking"}
                  </Button>
                </div>
              </>
            )}

            {step === "confirmed" && (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
                <p className="text-muted-foreground mb-6">
                  Your meeting has been scheduled for<br />
                  <strong className="text-foreground">
                    {selectedDate && format(selectedDate, "EEEE, MMMM d")} at {selectedTime && formatTime(selectedTime)}
                  </strong>
                </p>
                <Link to="/">
                  <Button variant="outline">Back to Homepage</Button>
                </Link>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Powered by <Link to="/" className="text-primary hover:underline">Schedulr</Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default BookPage;
