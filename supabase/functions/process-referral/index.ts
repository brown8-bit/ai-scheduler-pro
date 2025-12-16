import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-REFERRAL] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { referral_code, referred_user_id } = await req.json();
    logStep("Processing referral", { referral_code, referred_user_id });

    if (!referral_code || !referred_user_id) {
      throw new Error("Missing referral_code or referred_user_id");
    }

    // Find the referrer by referral code
    const { data: referrerProfile, error: referrerError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, display_name")
      .eq("referral_code", referral_code.toUpperCase())
      .single();

    if (referrerError || !referrerProfile) {
      logStep("Invalid referral code", { referral_code });
      return new Response(JSON.stringify({ error: "Invalid referral code" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Prevent self-referral
    if (referrerProfile.user_id === referred_user_id) {
      logStep("Self-referral attempted");
      return new Response(JSON.stringify({ error: "Cannot refer yourself" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check if this user was already referred
    const { data: existingReferral } = await supabaseAdmin
      .from("referrals")
      .select("id")
      .eq("referred_id", referred_user_id)
      .single();

    if (existingReferral) {
      logStep("User already referred");
      return new Response(JSON.stringify({ error: "User already referred" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create the referral record
    const { error: insertError } = await supabaseAdmin
      .from("referrals")
      .insert({
        referrer_id: referrerProfile.user_id,
        referred_id: referred_user_id,
        referral_code: referral_code.toUpperCase(),
        status: "completed",
        completed_at: new Date().toISOString(),
      });

    if (insertError) {
      logStep("Failed to create referral record", { error: insertError });
      throw new Error("Failed to create referral record");
    }

    // Create a 50% off coupon in Stripe for the referrer
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const coupon = await stripe.coupons.create({
      percent_off: 50,
      duration: "once",
      name: `Referral Reward - 50% Off`,
      metadata: {
        referrer_id: referrerProfile.user_id,
        referred_id: referred_user_id,
      },
    });

    // Create a promotion code for the coupon
    const promotionCode = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: `REF${referral_code}${Date.now().toString(36).toUpperCase()}`.slice(0, 20),
      max_redemptions: 1,
    });

    logStep("Created coupon and promotion code", { couponId: coupon.id, promoCode: promotionCode.code });

    // Update the referral with the coupon code
    await supabaseAdmin
      .from("referrals")
      .update({ 
        coupon_code: promotionCode.code,
        reward_claimed: false 
      })
      .eq("referrer_id", referrerProfile.user_id)
      .eq("referred_id", referred_user_id);

    // Create a notification for the referrer
    await supabaseAdmin
      .from("notifications")
      .insert({
        user_id: referrerProfile.user_id,
        actor_id: referred_user_id,
        type: "referral_reward",
        is_read: false,
      });

    logStep("Referral processed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Referral processed successfully",
      coupon_code: promotionCode.code 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
