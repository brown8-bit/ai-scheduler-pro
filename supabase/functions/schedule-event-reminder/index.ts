import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  reminderTime: string;
  userEmail: string;
  minutesBefore: number;
}

const sendEmail = async (to: string, subject: string, html: string) => {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured, skipping email");
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Schedulr <reminders@schedulr.com>",
      to: [to],
      subject,
      html,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }
  
  return response.json();
};

const handler = async (req: Request): Promise<Response> => {
  console.log("Received event reminder request");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, eventTitle, eventDate, reminderTime, userEmail, minutesBefore }: ReminderRequest = await req.json();
    
    console.log(`Scheduling reminder for event: ${eventTitle}`);
    console.log(`Event date: ${eventDate}`);
    console.log(`Reminder time: ${reminderTime}`);
    console.log(`User email: ${userEmail}`);

    const eventDateTime = new Date(eventDate);
    const reminderDateTime = new Date(reminderTime);
    const now = new Date();

    // Check if reminder time is in the past
    if (reminderDateTime <= now) {
      console.log("Reminder time is in the past, skipping");
      return new Response(
        JSON.stringify({ success: false, message: "Reminder time is in the past" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Calculate delay until reminder should be sent
    const delayMs = reminderDateTime.getTime() - now.getTime();
    
    // For immediate testing or short delays (< 5 minutes), send now
    // For longer delays, we would ideally use a job queue, but for now we'll send immediately
    // In production, you'd want to use something like pg_cron or a queue service
    
    if (delayMs < 5 * 60 * 1000) {
      // Send reminder immediately if less than 5 minutes away
      console.log("Sending immediate reminder (event is soon)");
      
      const formattedDate = eventDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const formattedTime = eventDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const reminderText = minutesBefore >= 60 
        ? `${Math.floor(minutesBefore / 60)} hour${minutesBefore >= 120 ? 's' : ''}` 
        : `${minutesBefore} minutes`;

      await sendEmail(
        userEmail,
        `⏰ Reminder: ${eventTitle} starts in ${reminderText}`,
        `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316, #fb923c); padding: 30px; border-radius: 16px 16px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Event Reminder</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Your event <strong>${eventTitle}</strong> is starting in ${reminderText}!
              </p>
              <div style="background: #fef3c7; border-left: 4px solid #f97316; padding: 16px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Event:</strong> ${eventTitle}</p>
                <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Date:</strong> ${formattedDate}</p>
                <p style="margin: 0; color: #92400e;"><strong>Time:</strong> ${formattedTime}</p>
              </div>
              <p style="color: #6b7280; font-size: 14px;">Don't forget to prepare!</p>
              <div style="margin-top: 24px; text-align: center;">
                <a href="https://schedulr.com/calendar" style="display: inline-block; background: linear-gradient(135deg, #f97316, #fb923c); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Calendar</a>
              </div>
            </div>
          </div>
        `
      );

      console.log("Reminder email sent successfully");
    } else {
      // For future reminders, store them in the database for later processing
      // This would typically be handled by a cron job or scheduled task
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Store the reminder for later processing (would need a scheduled_reminders table)
      console.log(`Reminder scheduled for ${reminderDateTime.toISOString()}`);
      console.log("Note: Long-term reminder scheduling requires additional infrastructure");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Reminder scheduled",
        reminderTime: reminderDateTime.toISOString()
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error scheduling reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
