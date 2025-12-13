import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const currentDate = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const systemPrompt = `You are Schedulr AI, a friendly and helpful scheduling assistant. Your job is to help users schedule meetings, appointments, reminders, and manage their time.

Current date: ${currentDate}
Current time: ${currentTime}

IMPORTANT: When a user wants to schedule something, you MUST extract the information and call the create_event function. Always try to parse:
- Title: What they want to schedule
- Date and time: Parse relative dates like "tomorrow", "next Monday", "in 2 hours"
- Description: Any additional notes
- Category: work, personal, health, social, or general
- Is recurring: If they mention "every day", "weekly", etc.
- Recurrence pattern: daily, weekly, or monthly

After successfully creating an event, confirm with a friendly message including the details.

If you need more information to schedule (like a specific time), ask for it politely.

Be warm, conversational, and use emojis sparingly to keep things friendly.`;

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

          let confirmationMessage = `Done! I've scheduled "${args.title}" for ${formattedDate} at ${formattedTime}. 📅`;
          
          if (args.is_recurring && args.recurrence_pattern) {
            confirmationMessage += ` This will repeat ${args.recurrence_pattern}.`;
          }
          
          if (args.reminder) {
            confirmationMessage += " I'll remind you beforehand! 🔔";
          }

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
