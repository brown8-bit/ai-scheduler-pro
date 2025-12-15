import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Usage limits by tier
const USAGE_LIMITS = {
  free: { ai_requests: 5, templates: 1 },
  pro: { ai_requests: 100, templates: 10 },
  lifetime: { ai_requests: 0, templates: 0 }, // 0 means unlimited
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-USAGE] ${step}${detailsStr}`);
};

async function getSubscriptionTier(userEmail: string): Promise<string> {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return "free";
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
    
    if (customers.data.length === 0) return "free";
    
    const customerId = customers.data[0].id;
    
    // Check for active subscription (Pro)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    
    if (subscriptions.data.length > 0) {
      const productId = subscriptions.data[0].items.data[0].price.product;
      if (productId === "prod_TbgdjToKIvSQ9T") return "lifetime";
      return "pro";
    }
    
    // Check for lifetime purchase
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 100,
    });
    
    for (const charge of charges.data) {
      if (charge.paid && charge.status === "succeeded" && charge.amount === 29900) {
        return "lifetime";
      }
    }
    
    return "free";
  } catch (error) {
    console.error("Error checking subscription:", error);
    return "free";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get subscription tier
    const tier = await getSubscriptionTier(user.email);
    const limits = USAGE_LIMITS[tier as keyof typeof USAGE_LIMITS] || USAGE_LIMITS.free;
    
    logStep("Determined tier", { tier, limits });

    // Get current usage from database
    const { data: usageData, error: usageError } = await supabaseClient
      .rpc('get_user_usage', { p_user_id: user.id });

    if (usageError) {
      logStep("Error getting usage", { error: usageError });
      throw new Error("Failed to get usage data");
    }

    logStep("Usage data retrieved", usageData);

    return new Response(JSON.stringify({
      tier,
      limits,
      usage: {
        ai_requests_this_month: usageData?.ai_requests_this_month || 0,
        templates_count: usageData?.templates_count || 0,
      },
      month_year: usageData?.month_year,
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
