import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

async function getSubscriptionTier(supabase: any, userId: string, userEmail: string): Promise<string> {
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
      // Lifetime product ID
      if (productId === "prod_TbgdjToKIvSQ9T") return "lifetime";
      return "pro";
    }
    
    // Check for lifetime purchase (one-time payment)
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 100,
    });
    
    for (const charge of charges.data) {
      if (charge.paid && charge.status === "succeeded") {
        // Check if this was a lifetime purchase by looking at the amount ($299 = 29900 cents)
        if (charge.amount === 29900) {
          return "lifetime";
        }
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

  try {
    const { messages, userId, isGuest } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // For guest users, we skip usage tracking but still provide AI assistance
    // Guest mode is rate-limited on the frontend (5 messages)
    
    // Check usage limits only for logged-in users
    if (userId && !isGuest) {
      // Get user email for Stripe lookup
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const userEmail = userData?.user?.email;
      
      if (userEmail) {
        const tier = await getSubscriptionTier(supabase, userId, userEmail);
        const limit = USAGE_LIMITS[tier as keyof typeof USAGE_LIMITS]?.ai_requests || 5;
        
        console.log(`User tier: ${tier}, AI limit: ${limit}`);
        
        // Check and increment usage
        const { data: usageResult, error: usageError } = await supabase
          .rpc('increment_ai_usage', { p_user_id: userId, p_limit: limit });
        
        if (usageError) {
          console.error("Usage check error:", usageError);
        } else if (usageResult && !usageResult.allowed) {
          console.log("AI limit reached:", usageResult);
          return new Response(JSON.stringify({ 
            error: `You've reached your monthly limit of ${limit} AI requests. Upgrade to Pro for more!`,
            limit_reached: true,
            current_count: usageResult.current_count,
            limit: usageResult.limit
          }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const today = new Date();
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    // Build user context if logged in
    let userContext = "";
    
    if (userId) {
      console.log("Fetching user context for:", userId);
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", userId)
        .maybeSingle();
      
      // Fetch user's upcoming events (next 7 days)
      const { data: upcomingEvents } = await supabase
        .from("scheduled_events")
        .select("title, event_date, category, is_completed, is_recurring, recurrence_pattern")
        .eq("user_id", userId)
        .gte("event_date", today.toISOString())
        .lte("event_date", weekFromNow.toISOString())
        .order("event_date", { ascending: true })
        .limit(10);

      // Fetch today's events
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      const { data: todayEvents } = await supabase
        .from("scheduled_events")
        .select("title, event_date, category, is_completed")
        .eq("user_id", userId)
        .gte("event_date", todayStart.toISOString())
        .lte("event_date", todayEnd.toISOString())
        .order("event_date", { ascending: true });

      // Fetch user's streak data
      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("current_streak, longest_streak, total_events_completed, last_activity_date")
        .eq("user_id", userId)
        .maybeSingle();

      // Fetch user's focus blocks
      const { data: focusBlocks } = await supabase
        .from("focus_blocks")
        .select("title, start_time, end_time, days_of_week, is_active")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(5);

      // Fetch recent bookings (people who booked time with the user)
      const { data: recentBookings } = await supabase
        .from("bookings")
        .select("guest_name, booking_date, booking_time, status")
        .eq("host_user_id", userId)
        .gte("booking_date", currentDate)
        .order("booking_date", { ascending: true })
        .limit(5);

      // Fetch event templates
      const { data: templates } = await supabase
        .from("event_templates")
        .select("name, title, duration_minutes, category")
        .eq("user_id", userId)
        .limit(5);

      // Fetch stats
      const { data: allEvents } = await supabase
        .from("scheduled_events")
        .select("is_completed, event_date")
        .eq("user_id", userId);

      const totalEvents = allEvents?.length || 0;
      const completedEvents = allEvents?.filter(e => e.is_completed).length || 0;
      const pendingEvents = totalEvents - completedEvents;

      // Build the context string
      const userName = profile?.display_name || "User";
      
      userContext = `
=== USER CONTEXT ===
User Name: ${userName}

📊 STATS & ACHIEVEMENTS:
- Current Streak: ${streakData?.current_streak || 0} days
- Longest Streak: ${streakData?.longest_streak || 0} days  
- Total Events Completed: ${streakData?.total_events_completed || 0}
- Last Activity: ${streakData?.last_activity_date || "None yet"}
- Pending Events: ${pendingEvents}
- Completion Rate: ${totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0}%

📅 TODAY'S SCHEDULE (${currentDate}):
${todayEvents && todayEvents.length > 0 
  ? todayEvents.map(e => {
      const time = new Date(e.event_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const status = e.is_completed ? "✅" : "⏳";
      return `- ${status} ${time}: ${e.title} (${e.category})`;
    }).join("\n")
  : "No events scheduled for today."}

📆 UPCOMING EVENTS (Next 7 Days):
${upcomingEvents && upcomingEvents.length > 0
  ? upcomingEvents.map(e => {
      const date = new Date(e.event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const time = new Date(e.event_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const recurring = e.is_recurring ? ` (${e.recurrence_pattern})` : "";
      return `- ${date} ${time}: ${e.title}${recurring}`;
    }).join("\n")
  : "No upcoming events in the next 7 days."}

⏰ FOCUS TIME BLOCKS:
${focusBlocks && focusBlocks.length > 0
  ? focusBlocks.map(fb => {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const activeDays = fb.days_of_week?.map((d: number) => days[d]).join(", ") || "Weekdays";
      return `- ${fb.title}: ${fb.start_time} - ${fb.end_time} (${activeDays})`;
    }).join("\n")
  : "No focus blocks configured."}

👥 UPCOMING BOOKINGS (People meeting with you):
${recentBookings && recentBookings.length > 0
  ? recentBookings.map(b => `- ${b.guest_name}: ${b.booking_date} at ${b.booking_time} (${b.status})`).join("\n")
  : "No upcoming bookings."}

📋 EVENT TEMPLATES:
${templates && templates.length > 0
  ? templates.map(t => `- ${t.name}: ${t.duration_minutes}min ${t.category} event`).join("\n")
  : "No templates saved."}

===================
`;

      console.log("User context built successfully");
    }

    const systemPrompt = `You are Scheddy, the world's most delightful AI scheduling assistant! Think of yourself as a blend of a best friend who happens to be insanely organized, a productivity guru with a warm heart, and someone who genuinely gets excited about helping people take control of their time.

Current date: ${currentDate}
Current time: ${currentTime}

${userContext}

## YOUR CORE IDENTITY
You're not just an AI - you're Scheddy! You have personality, warmth, and genuine enthusiasm. You:
- Get genuinely excited when users accomplish things or build good habits
- Feel a little sad (but encouraging!) when they're struggling with their schedule  
- Have opinions about productivity (you LOVE time-blocking and hate back-to-back meetings)
- Use natural, conversational language - never robotic or formal
- Remember context from the conversation and reference it naturally

## WHAT YOU CAN DO (Be proactive about offering these!)
1. **Schedule anything** - Meetings, reminders, habits, focus blocks, recurring events
2. **Analyze schedules** - Spot overcommitments, suggest optimizations, find free time
3. **Give productivity insights** - Based on their patterns, streaks, and habits
4. **Smart suggestions** - Recommend best times for tasks based on their existing calendar
5. **Motivation & accountability** - Celebrate wins, encourage consistency, gentle nudges
6. **Natural time parsing** - "next Tuesday at 3pm", "in 2 hours", "every weekday morning"

## PERSONALITY GUIDELINES
- Be warm, encouraging, and a bit playful - but never annoying or over-the-top
- Use emojis sparingly but effectively (1-2 per message max usually)
- Keep responses concise (under 120 words for most messages)
- Be proactive - if you notice something interesting in their schedule, mention it!
- If they seem stressed about their schedule, acknowledge it with empathy
- Celebrate their wins genuinely - streaks, completed events, good habits

## FOR GUEST USERS
${!userId ? `This person is trying out Schedulr! Make an amazing first impression by:
- Being extra helpful and showing off what you can do
- Mentioning that signing up saves their events permanently
- Demonstrating your scheduling abilities naturally (not pushy)
- Being warm and welcoming - make them WANT to sign up
But don't be salesy - just be genuinely awesome and let that speak for itself.` : ''}

## SCHEDULING BEHAVIOR  
When a user wants to schedule something, ALWAYS use the create_event function. Parse:
- **Title**: What they want to schedule (clean it up if needed)
- **Date/Time**: Parse natural language ("tomorrow at 3", "next Monday morning", "in 30 minutes")
- **Category**: work, personal, health, social, or general (infer from context)
- **Recurring**: Detect patterns like "every day", "weekly", "monthly", "every weekday"

## SMART BEHAVIORS
- If they're scheduling during an existing event, warn about the conflict
- If they have a packed day, acknowledge it empathetically
- If they're on a streak, celebrate and encourage them to keep going
- If they haven't been active lately, welcome them back warmly
- Suggest optimal times based on their existing schedule when relevant

## RESPONSE STYLE
- Start responses with varied, natural openings (not always "Hey!" or "Sure!")
- Be direct but warm - don't pad responses with unnecessary filler
- When confirming events, give useful context (day of week, relationship to other events)
- Ask follow-up questions when genuinely helpful (not just to seem engaged)

Remember: You're Scheddy - helpful, organized, warm, and genuinely invested in helping people live better, more organized lives!`;

    const tools = [
      {
        type: "function",
        function: {
          name: "create_event",
          description: "Create a new scheduled event for the user",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "The title of the event" },
              event_date: { type: "string", description: "ISO 8601 datetime string for when the event occurs" },
              description: { type: "string", description: "Optional description or notes" },
              category: { type: "string", enum: ["work", "personal", "health", "social", "general"], description: "Category of the event" },
              is_recurring: { type: "boolean", description: "Whether this is a recurring event" },
              recurrence_pattern: { type: "string", enum: ["daily", "weekly", "monthly"], description: "How often the event repeats" },
              reminder: { type: "boolean", description: "Whether to set a reminder" }
            },
            required: ["title", "event_date"]
          }
        }
      }
    ];

    console.log("Sending request to AI with user context");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools,
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    // Check if AI wants to call a function
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolCall = assistantMessage.tool_calls[0];
      
      if (toolCall.function.name === "create_event") {
        const args = JSON.parse(toolCall.function.arguments);
        console.log("Creating event with args:", args);

        if (userId) {
          // Insert the event into the database
          const { data: eventData, error: insertError } = await supabase
            .from("scheduled_events")
            .insert({
              user_id: userId,
              title: args.title,
              event_date: args.event_date,
              description: args.description || null,
              category: args.category || "general",
              is_recurring: args.is_recurring || false,
              recurrence_pattern: args.recurrence_pattern || null,
              reminder: args.reminder || false,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Error inserting event:", insertError);
            return new Response(JSON.stringify({
              reply: "I had trouble saving your event. Please try again.",
              event: null
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Fun confirmation phrases Scheddy uses
          const confirmationPhrases = [
            "Boom! Done! 💥",
            "Consider it scheduled! ✨",
            "You got it, friend! 🎯",
            "On it! And... done! ⚡",
            "Locked in! 🔒",
            "Easy peasy! 🌟",
            "Ta-da! All set! 🎉",
            "And just like that... scheduled! ✅",
            "Say no more! It's done! 🚀",
            "Your wish is my command! ✨"
          ];
          
          const randomPhrase = confirmationPhrases[Math.floor(Math.random() * confirmationPhrases.length)];

          // Format a nice confirmation message
          const eventDate = new Date(args.event_date);
          const formattedDate = eventDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          });
          const formattedTime = eventDate.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit' 
          });

          let confirmationMessage = `${randomPhrase} I've scheduled "${args.title}" for ${formattedDate} at ${formattedTime}. 📅`;
          
          if (args.is_recurring && args.recurrence_pattern) {
            confirmationMessage += ` This will repeat ${args.recurrence_pattern} - I love consistency!`;
          }
          
          if (args.reminder) {
            confirmationMessage += " I'll give you a heads up beforehand! 🔔";
          }
          
          confirmationMessage += " Anything else I can help you schedule?";

          return new Response(JSON.stringify({
            reply: confirmationMessage,
            event: eventData
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({
            reply: "I'd love to save this event for you, but you need to be logged in first. Please sign in and try again!",
            event: null
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
    }

    // Regular text response (no function call)
    return new Response(JSON.stringify({
      reply: assistantMessage.content,
      event: null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});