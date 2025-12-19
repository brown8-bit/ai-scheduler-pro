import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  hostEmail: string;
  guestName: string;
  guestEmail: string;
  bookingDate: string;
  bookingTime: string;
  meetingTitle: string;
  notes?: string;
}

const sendEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Schedulr <Support@schedulr.com>",
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
  console.log("Received booking notification request");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { hostEmail, guestName, guestEmail, bookingDate, bookingTime, meetingTitle, notes }: BookingNotificationRequest = await req.json();
    
    console.log(`Sending booking notification to host: ${hostEmail} and guest: ${guestEmail}`);

    const formattedDate = new Date(bookingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send email to host
    const hostEmailResponse = await sendEmail(
      hostEmail,
      `New Booking: ${guestName} scheduled a ${meetingTitle}`,
      `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316, #fb923c); padding: 30px; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">📅 New Booking Confirmed!</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Great news! <strong>${guestName}</strong> has booked time with you.
            </p>
            <div style="background: #fef3c7; border-left: 4px solid #f97316; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Meeting:</strong> ${meetingTitle}</p>
              <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 0 0 8px 0; color: #92400e;"><strong>Time:</strong> ${bookingTime}</p>
              <p style="margin: 0; color: #92400e;"><strong>Guest Email:</strong> ${guestEmail}</p>
              ${notes ? `<p style="margin: 8px 0 0 0; color: #92400e;"><strong>Notes:</strong> ${notes}</p>` : ''}
            </div>
            <p style="color: #6b7280; font-size: 14px;">Add this to your calendar and prepare for your meeting!</p>
          </div>
        </div>
      `
    );

    console.log("Host email sent:", hostEmailResponse);

    // Send confirmation email to guest
    const guestEmailResponse = await sendEmail(
      guestEmail,
      `Booking Confirmed: ${meetingTitle} on ${formattedDate}`,
      `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #f97316, #fb923c); padding: 30px; border-radius: 16px 16px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Your Booking is Confirmed!</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Hi <strong>${guestName}</strong>,</p>
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">Your meeting has been successfully scheduled:</p>
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Meeting:</strong> ${meetingTitle}</p>
              <p style="margin: 0 0 8px 0; color: #065f46;"><strong>Date:</strong> ${formattedDate}</p>
              <p style="margin: 0; color: #065f46;"><strong>Time:</strong> ${bookingTime}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">We look forward to meeting with you!</p>
          </div>
        </div>
      `
    );

    console.log("Guest email sent:", guestEmailResponse);

    return new Response(
      JSON.stringify({ success: true, hostEmail: hostEmailResponse, guestEmail: guestEmailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error sending booking notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
