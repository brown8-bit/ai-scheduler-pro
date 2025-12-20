import { supabase } from "@/integrations/supabase/client";

const DEMO_SESSION_KEY = "schedulr_demo_session";

// Generate or retrieve a persistent session ID for demo tracking
const getSessionId = (): string => {
  let sessionId = localStorage.getItem(DEMO_SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(DEMO_SESSION_KEY, sessionId);
  }
  return sessionId;
};

export const trackDemoReset = async (promptsUsed: number): Promise<void> => {
  try {
    const sessionId = getSessionId();
    await supabase.from("demo_analytics").insert({
      event_type: "demo_reset",
      session_id: sessionId,
      prompts_used: promptsUsed,
      metadata: { timestamp: new Date().toISOString() },
    });
    console.log("[Analytics] Demo reset tracked");
  } catch (error) {
    console.error("[Analytics] Failed to track demo reset:", error);
  }
};

export const trackDemoSignupConversion = async (): Promise<void> => {
  try {
    const sessionId = localStorage.getItem(DEMO_SESSION_KEY);
    if (!sessionId) {
      // User never used demo mode
      return;
    }

    await supabase.from("demo_analytics").insert({
      event_type: "demo_signup_conversion",
      session_id: sessionId,
      metadata: { timestamp: new Date().toISOString() },
    });
    console.log("[Analytics] Demo signup conversion tracked");
    
    // Clear the session after tracking conversion
    localStorage.removeItem(DEMO_SESSION_KEY);
  } catch (error) {
    console.error("[Analytics] Failed to track conversion:", error);
  }
};

export const useDemoAnalytics = () => {
  return {
    trackDemoReset,
    trackDemoSignupConversion,
  };
};
