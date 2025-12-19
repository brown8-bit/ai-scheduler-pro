import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      console.error("OAuth error:", error);
      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'google-calendar-error',error:'${error}'},'*');window.close();</script><p>Authentication failed. You can close this window.</p></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    if (!code || !state) {
      console.error("Missing code or state");
      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'google-calendar-error',error:'missing_params'},'*');window.close();</script><p>Invalid request. You can close this window.</p></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // Decode state
    let stateData;
    try {
      stateData = JSON.parse(atob(state));
    } catch (e) {
      console.error("Invalid state:", e);
      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'google-calendar-error',error:'invalid_state'},'*');window.close();</script><p>Invalid state. You can close this window.</p></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const { userId, redirectUrl } = stateData;
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const googleClientId = Deno.env.get("GOOGLE_CLIENT_ID")!;
    const googleClientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

    // Exchange code for tokens
    const tokenUrl = "https://oauth2.googleapis.com/token";
    const redirectUri = `${supabaseUrl}/functions/v1/google-calendar-callback`;
    
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token exchange failed:", errorText);
      return new Response(
        `<html><body><script>window.opener?.postMessage({type:'google-calendar-error',error:'token_exchange_failed'},'*');window.close();</script><p>Failed to connect. You can close this window.</p></body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const tokens = await tokenResponse.json();
    console.log("Tokens received for user:", userId);

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    let providerEmail = null;
    let providerAccountId = null;
    if (userInfoResponse.ok) {
      const userInfo = await userInfoResponse.json();
      providerEmail = userInfo.email;
      providerAccountId = userInfo.id;
      console.log("Google user:", providerEmail);
    }

    // Store connection in database using service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if connection already exists
    const { data: existing } = await supabase
      .from("calendar_connections")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", "google")
      .single();

    const connectionData = {
      user_id: userId,
      provider: "google",
      provider_email: providerEmail,
      provider_account_id: providerAccountId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      sync_enabled: true,
      sync_status: "synced",
      last_synced_at: new Date().toISOString(),
    };

    if (existing) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from("calendar_connections")
        .update(connectionData)
        .eq("id", existing.id);
      
      if (updateError) {
        console.error("Update error:", updateError);
        throw updateError;
      }
      console.log("Updated existing connection:", existing.id);
    } else {
      // Insert new connection
      const { error: insertError } = await supabase
        .from("calendar_connections")
        .insert(connectionData);
      
      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }
      console.log("Created new connection for user:", userId);
    }

    // Return success HTML that communicates with opener and redirects
    const successHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Calendar Connected</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .card {
              background: white;
              padding: 2rem;
              border-radius: 1rem;
              text-align: center;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .success-icon {
              font-size: 3rem;
              margin-bottom: 1rem;
            }
            h1 { color: #1a1a1a; margin: 0 0 0.5rem; }
            p { color: #666; margin: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="success-icon">✅</div>
            <h1>Calendar Connected!</h1>
            <p>You can close this window.</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'google-calendar-success' }, '*');
            }
            setTimeout(() => window.close(), 1500);
          </script>
        </body>
      </html>
    `;

    return new Response(successHtml, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Callback error:", message);
    return new Response(
      `<html><body><script>window.opener?.postMessage({type:'google-calendar-error',error:'${message}'},'*');window.close();</script><p>Error: ${message}</p></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }
});
