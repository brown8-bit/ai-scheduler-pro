import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Refresh access token
async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; expires_in: number } | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Get valid access token
async function getValidAccessToken(
  connection: {
    id: string;
    access_token: string | null;
    refresh_token: string | null;
    token_expires_at: string | null;
  },
  supabase: any,
  clientId: string,
  clientSecret: string
): Promise<string | null> {
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
  const now = new Date();

  if (connection.access_token && expiresAt && expiresAt.getTime() - 300000 > now.getTime()) {
    return connection.access_token;
  }

  if (!connection.refresh_token) return null;

  const tokens = await refreshAccessToken(connection.refresh_token, clientId, clientSecret);
  if (!tokens) return null;

  await supabase
    .from("calendar_connections")
    .update({
      access_token: tokens.access_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq("id", connection.id);

  return tokens.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { 
      bookingId,
      hostUserId,
      guestName,
      guestEmail,
      bookingDate,
      bookingTime,
      meetingTitle,
      durationMinutes = 30,
      location,
      notes,
    } = body;

    console.log("Creating calendar event for booking:", bookingId);

    // Check if Google Calendar credentials are configured
    if (!googleClientId || !googleClientSecret) {
      console.log("Google Calendar not configured, skipping calendar event creation");
      return new Response(
        JSON.stringify({ 
          success: false, 
          skipped: true,
          reason: "Google Calendar not configured" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get host's Google Calendar connection
    const { data: connection, error: connError } = await supabase
      .from("calendar_connections")
      .select("*")
      .eq("user_id", hostUserId)
      .eq("provider", "google")
      .eq("sync_enabled", true)
      .maybeSingle();

    if (connError || !connection) {
      console.log("No Google Calendar connection found for host:", hostUserId);
      return new Response(
        JSON.stringify({ 
          success: false, 
          skipped: true,
          reason: "Host has no Google Calendar connected" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get valid access token
    const accessToken = await getValidAccessToken(
      connection,
      supabase,
      googleClientId,
      googleClientSecret
    );

    if (!accessToken) {
      console.error("Failed to get valid access token for calendar");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to authenticate with Google Calendar" 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse booking date and time
    const [hours, minutes] = bookingTime.split(":").map(Number);
    const startDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    // Get timezone from connection settings or default to UTC
    const timeZone = connection.settings?.timezone || "UTC";

    // Create the Google Calendar event with Google Meet
    const googleEvent = {
      summary: `📅 ${meetingTitle} with ${guestName}`,
      description: `Booking from Schedulr\n\nGuest: ${guestName}\nEmail: ${guestEmail}${notes ? `\n\nNotes: ${notes}` : ""}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone,
      },
      attendees: [
        { email: guestEmail, displayName: guestName }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
      location: location || undefined,
      transparency: "opaque",
      status: "confirmed",
      // Add Google Meet conference
      conferenceData: {
        createRequest: {
          requestId: `booking-${bookingId}-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    };

    console.log("Creating Google Calendar event with Meet:", JSON.stringify({
      summary: googleEvent.summary,
      start: googleEvent.start,
      end: googleEvent.end,
      hasConferenceData: true,
    }));

    // Use conferenceDataVersion=1 to enable Google Meet link generation
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all&conferenceDataVersion=1",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleEvent),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Google Calendar API error:", error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Failed to create calendar event" 
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createdEvent = await response.json();
    const meetLink = createdEvent.conferenceData?.entryPoints?.find(
      (e: any) => e.entryPointType === "video"
    )?.uri;
    
    console.log("Calendar event created:", createdEvent.id, "Meet link:", meetLink);

    // Also save to synced_events table
    await supabase.from("synced_events").insert({
      connection_id: connection.id,
      user_id: hostUserId,
      external_event_id: createdEvent.id,
      title: createdEvent.summary,
      description: createdEvent.description,
      start_time: createdEvent.start.dateTime || createdEvent.start.date,
      end_time: createdEvent.end.dateTime || createdEvent.end.date,
      is_all_day: !createdEvent.start.dateTime,
      location: meetLink || createdEvent.location,
      status: createdEvent.status,
      is_busy: true,
      raw_data: createdEvent,
    });

    // Update the booking with the calendar event ID and meet link
    if (bookingId) {
      const updateData: any = { status: "confirmed" };
      if (meetLink) {
        // Store meet link in notes or a dedicated field if available
        updateData.notes = `${notes ? notes + "\n\n" : ""}📹 Google Meet: ${meetLink}`;
      }
      await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", bookingId);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventId: createdEvent.id,
        eventLink: createdEvent.htmlLink,
        meetLink: meetLink || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating calendar event for booking:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
