import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateEventInput {
  summary: string;
  description?: string;
  start: string;
  end: string;
  timeZone?: string;
  location?: string;
  attendees?: string[];
  reminders?: { method: string; minutes: number }[];
}

interface UpdateEventInput extends Partial<CreateEventInput> {
  eventId: string;
}

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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

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

    const body = await req.json();
    const { action, connectionId, calendarId = "primary", ...eventData } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get connection
    const { data: connection, error: connError } = await supabase
      .from("calendar_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("user_id", user.id)
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: "Connection not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

    // Get timezone from connection settings
    const timeZone = connection.settings?.timezone || "UTC";

    switch (action) {
      case "create": {
        const createData = eventData as CreateEventInput;
        const googleEvent = {
          summary: createData.summary,
          description: createData.description,
          location: createData.location,
          start: {
            dateTime: createData.start,
            timeZone: createData.timeZone || timeZone,
          },
          end: {
            dateTime: createData.end,
            timeZone: createData.timeZone || timeZone,
          },
          attendees: createData.attendees?.map(email => ({ email })),
          reminders: createData.reminders
            ? { useDefault: false, overrides: createData.reminders }
            : { useDefault: true },
        };

        const response = await fetch(baseUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(googleEvent),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error("Create event failed:", error);
          return new Response(
            JSON.stringify({ error: "Failed to create event" }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const createdEvent = await response.json();
        console.log("Event created:", createdEvent.id);

        // Also save to synced_events
        await supabase.from("synced_events").insert({
          connection_id: connection.id,
          user_id: user.id,
          external_event_id: createdEvent.id,
          title: createdEvent.summary,
          description: createdEvent.description,
          start_time: createdEvent.start.dateTime || createdEvent.start.date,
          end_time: createdEvent.end.dateTime || createdEvent.end.date,
          is_all_day: !createdEvent.start.dateTime,
          location: createdEvent.location,
          status: createdEvent.status,
          is_busy: true,
          raw_data: createdEvent,
        });

        return new Response(
          JSON.stringify({ success: true, event: createdEvent }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "update": {
        const updateData = eventData as UpdateEventInput;
        const { eventId, ...updates } = updateData;

        const googleEvent: Record<string, unknown> = {};
        if (updates.summary) googleEvent.summary = updates.summary;
        if (updates.description) googleEvent.description = updates.description;
        if (updates.location) googleEvent.location = updates.location;
        if (updates.start) {
          googleEvent.start = {
            dateTime: updates.start,
            timeZone: updates.timeZone || timeZone,
          };
        }
        if (updates.end) {
          googleEvent.end = {
            dateTime: updates.end,
            timeZone: updates.timeZone || timeZone,
          };
        }

        const response = await fetch(`${baseUrl}/${eventId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(googleEvent),
        });

        if (!response.ok) {
          const error = await response.text();
          console.error("Update event failed:", error);
          return new Response(
            JSON.stringify({ error: "Failed to update event" }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updatedEvent = await response.json();

        // Update synced_events
        await supabase
          .from("synced_events")
          .update({
            title: updatedEvent.summary,
            description: updatedEvent.description,
            start_time: updatedEvent.start.dateTime || updatedEvent.start.date,
            end_time: updatedEvent.end.dateTime || updatedEvent.end.date,
            location: updatedEvent.location,
            raw_data: updatedEvent,
            updated_at: new Date().toISOString(),
          })
          .eq("external_event_id", eventId)
          .eq("connection_id", connection.id);

        return new Response(
          JSON.stringify({ success: true, event: updatedEvent }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "delete": {
        const { eventId } = eventData;

        const response = await fetch(`${baseUrl}/${eventId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok && response.status !== 410) {
          return new Response(
            JSON.stringify({ error: "Failed to delete event" }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Remove from synced_events
        await supabase
          .from("synced_events")
          .delete()
          .eq("external_event_id", eventId)
          .eq("connection_id", connection.id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "createFocusBlock": {
        // Create a focus time block
        const { title = "Focus Time", start, end, description = "Blocked for focused work" } = eventData;

        const focusEvent = {
          summary: `🎯 ${title}`,
          description,
          start: { dateTime: start, timeZone },
          end: { dateTime: end, timeZone },
          transparency: "opaque",
          visibility: "private",
          colorId: "11", // Red color for focus time
        };

        const response = await fetch(baseUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(focusEvent),
        });

        if (!response.ok) {
          return new Response(
            JSON.stringify({ error: "Failed to create focus block" }),
            { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const createdEvent = await response.json();

        await supabase.from("synced_events").insert({
          connection_id: connection.id,
          user_id: user.id,
          external_event_id: createdEvent.id,
          title: createdEvent.summary,
          description: createdEvent.description,
          start_time: createdEvent.start.dateTime,
          end_time: createdEvent.end.dateTime,
          is_all_day: false,
          is_busy: true,
          raw_data: createdEvent,
        });

        return new Response(
          JSON.stringify({ success: true, event: createdEvent }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Events error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
