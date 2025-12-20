import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const VISITOR_SESSION_KEY = 'schedulr_visitor_session';

const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem(VISITOR_SESSION_KEY);
  if (!sessionId) {
    sessionId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(VISITOR_SESSION_KEY, sessionId);
  }
  return sessionId;
};

export const useVisitorTracking = () => {
  useEffect(() => {
    const trackPageVisit = async () => {
      // Check if user is authenticated - skip tracking if logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        return; // Don't track authenticated users
      }

      const sessionId = getOrCreateSessionId();
      const pagePath = window.location.pathname;
      const referrer = document.referrer || null;
      const userAgent = navigator.userAgent;

      try {
        await supabase.from('visitor_analytics').insert({
          session_id: sessionId,
          page_path: pagePath,
          referrer,
          user_agent: userAgent,
        });
      } catch (error) {
        console.error('Failed to track visitor:', error);
      }
    };

    trackPageVisit();
  }, []);
};
