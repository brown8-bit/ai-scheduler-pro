import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OTPRequest {
  email: string;
  action: "send" | "verify";
  code?: string;
}

// Generate a 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP with expiration (10 minutes)
const otpStore = new Map<string, { code: string; expires: number }>();

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
      from: "Schedulr <verify@schedulr.com>",
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
  console.log("Received OTP request");
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, action, code }: OTPRequest = await req.json();
    
    console.log(`OTP action: ${action} for email: ${email}`);

    if (action === "send") {
      // Generate and store OTP
      const otp = generateOTP();
      const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
      
      // Use email as key for OTP storage
      otpStore.set(email.toLowerCase(), { code: otp, expires });
      
      console.log(`Generated OTP for ${email}: ${otp}`);

      // Send OTP via email
      await sendEmail(
        email,
        "Your Schedulr verification code",
        `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f97316, #fb923c); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📧 Verify Your Email</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Your verification code is:
              </p>
              <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 12px;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #f97316; font-family: monospace;">
                  ${otp}
                </span>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                This code expires in 10 minutes.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </div>
          </div>
        `
      );

      return new Response(
        JSON.stringify({ success: true, message: "OTP sent" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else if (action === "verify") {
      // Verify OTP
      const stored = otpStore.get(email.toLowerCase());
      
      if (!stored) {
        return new Response(
          JSON.stringify({ success: false, message: "No verification code found. Please request a new one." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (Date.now() > stored.expires) {
        otpStore.delete(email.toLowerCase());
        return new Response(
          JSON.stringify({ success: false, message: "Verification code has expired. Please request a new one." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (stored.code !== code) {
        return new Response(
          JSON.stringify({ success: false, message: "Invalid verification code. Please try again." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // OTP verified successfully
      otpStore.delete(email.toLowerCase());
      
      return new Response(
        JSON.stringify({ success: true, message: "Email verified" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in email-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
