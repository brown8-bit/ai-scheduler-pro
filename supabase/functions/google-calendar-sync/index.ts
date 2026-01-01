import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  status?: string;
  location?: string;
  attendees?: Array<{ email: string; responseStatus?: string }>;
}

// Refresh access token if expired
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

    if (!response.ok) {
      console.error("Token refresh failed:", await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

// Get valid access token, refreshing if necessary
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
  
  // If token is still valid (with 5 min buffer), return it
  if (connection.access_token && expiresAt && expiresAt.getTime() - 300000 > now.getTime()) {
    return connection.access_token;
  }

  // Need to refresh
  if (!connection.refresh_token) {
    console.error("No refresh token available");
    return null;
  }

  console.log("Refreshing access token for connection:", connection.id);
  const tokens = await refreshAccessToken(connection.refresh_token, clientId, clientSecret);
  
  if (!tokens) {
    // Update connection status to error
    await (supabase as any)
      .from("calendar_connections")
      .update({ sync_status: "error", sync_error: "Token refresh failed" })
      .eq("id", connection.id);
    return null;
  }

  // Update tokens in database
  await (supabase as any)
    .from("calendar_connections")
    .update({
      access_token: tokens.access_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      sync_error: null,
    })
    .eq("id", connection.id);

  return tokens.access_token;
}

// Fetch events from Google Calendar
async function fetchGoogleEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string,
  calendarId: string = "primary"
): Promise<GoogleEvent[]> {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "250");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to fetch events:", error);
    throw new Error(`Failed to fetch events: ${response.status}`);
  }

  const data = await response.json();
  return data.items || [];
}

// Get user's timezone from Google Calendar
async function getUserTimezone(accessToken: string): Promise<string> {
  try {
    const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/settings/timezone", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.value || "UTC";
    }
  } catch (error) {
    console.error("Failed to get timezone:", error);
  }
  return "UTC";
}

// Get list of calendars
async function getCalendarList(accessToken: string): Promise<Array<{ id: string; summary: string; primary?: boolean }>> {
  try {
    const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.items || [];
    }
  } catch (error) {
    console.error("Failed to get calendar list:", error);
  }
  return [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

    // Verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { connectionId, syncDays = 30, action } = body;

    // Use service role for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get calendar connection(s)
    let connectionsQuery = supabase
      .from("calendar_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("provider", "google");

    if (connectionId) {
      connectionsQuery = connectionsQuery.eq("id", connectionId);
    }

    const { data: connections, error: connError } = await connectionsQuery;

    if (connError || !connections || connections.length === 0) {
      return new Response(
        JSON.stringify({ error: "No Google Calendar connection found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle listCalendars action
    if (action === "listCalendars") {
      const connection = connections[0];
      const accessToken = await getValidAccessToken(
        connection,
        supabase,
        googleClientId,
        googleClientSecret
      );

      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: "Failed to get access token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const calendars = await getCalendarList(accessToken);
      return new Response(
        JSON.stringify({ calendars }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const connection of connections) {
      try {
        // Update sync status
        await supabase
          .from("calendar_connections")
          .update({ sync_status: "syncing" })
          .eq("id", connection.id);

        // Get valid access token
        const accessToken = await getValidAccessToken(
          connection,
          supabase,
          googleClientId,
          googleClientSecret
        );

        if (!accessToken) {
          results.push({ connectionId: connection.id, error: "Failed to get access token" });
          continue;
        }

        // Get user's timezone
        const timezone = await getUserTimezone(accessToken);

        // Calculate time range
        const now = new Date();
        const timeMin = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
        const timeMax = new Date(now.getTime() + syncDays * 24 * 60 * 60 * 1000).toISOString();

        // Get calendar list
        const calendars = await getCalendarList(accessToken);
        const calendarIds = connection.calendar_ids?.length 
          ? connection.calendar_ids 
          : calendars.filter(c => c.primary).map(c => c.id);

        let totalEvents = 0;

        for (const calendarId of calendarIds.length ? calendarIds : ["primary"]) {
          // Fetch events from Google
          const googleEvents = await fetchGoogleEvents(accessToken, timeMin, timeMax, calendarId);

          // Delete existing synced events for this connection in the time range
          await supabase
            .from("synced_events")
            .delete()
            .eq("connection_id", connection.id)
            .gte("start_time", timeMin)
            .lte("end_time", timeMax);

          // Insert new events
          const eventsToInsert = googleEvents
            .filter(event => event.status !== "cancelled")
            .map(event => ({
              connection_id: connection.id,
              user_id: user.id,
              external_event_id: event.id,
              title: event.summary || "Busy",
              description: event.description || null,
              start_time: event.start.dateTime || `${event.start.date}T00:00:00Z`,
              end_time: event.end.dateTime || `${event.end.date}T23:59:59Z`,
              is_all_day: !event.start.dateTime,
              location: event.location || null,
              status: event.status || "confirmed",
              is_busy: true,
              attendees: event.attendees ? JSON.stringify(event.attendees) : null,
              raw_data: event,
            }));

          if (eventsToInsert.length > 0) {
            const { error: insertError } = await supabase
              .from("synced_events")
              .insert(eventsToInsert);

            if (insertError) {
              console.error("Error inserting events:", insertError);
            } else {
              totalEvents += eventsToInsert.length;
            }
          }
        }

        // Update connection with sync status and timezone
        await supabase
          .from("calendar_connections")
          .update({
            sync_status: "synced",
            last_synced_at: new Date().toISOString(),
            sync_error: null,
            settings: {
              ...(connection.settings || {}),
              timezone,
              calendars: calendars.map(c => ({ id: c.id, name: c.summary, primary: c.primary })),
            },
          })
          .eq("id", connection.id);

        results.push({
          connectionId: connection.id,
          eventsSync: totalEvents,
          timezone,
          calendarsFound: calendars.length,
        });

        console.log(`Synced ${totalEvents} events for connection ${connection.id}`);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Error syncing connection ${connection.id}:`, message);

        await supabase
          .from("calendar_connections")
          .update({ sync_status: "error", sync_error: message })
          .eq("id", connection.id);

        results.push({ connectionId: connection.id, error: message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Sync error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
