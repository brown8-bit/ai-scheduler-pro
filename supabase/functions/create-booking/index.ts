import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting (per IP and per email)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_IP = 5; // 5 bookings per minute per IP
const MAX_REQUESTS_PER_EMAIL = 3; // 3 bookings per minute per email

const checkRateLimit = (key: string, maxRequests: number): { allowed: boolean; remaining: number } => {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
};

// Simple validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
};

const sanitizeText = (text: string): string => {
  // Remove potential HTML/script tags and trim
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim();
};

const validateBookingInput = (data: any): { valid: boolean; errors: string[]; sanitized?: any } => {
  const errors: string[] = [];
  
  // Validate guest_name
  if (!data.guest_name || typeof data.guest_name !== 'string') {
    errors.push('Guest name is required');
  } else if (data.guest_name.trim().length < 2) {
    errors.push('Guest name must be at least 2 characters');
  } else if (data.guest_name.length > 100) {
    errors.push('Guest name must be less than 100 characters');
  }
  
  // Validate guest_email
  if (!data.guest_email || typeof data.guest_email !== 'string') {
    errors.push('Email is required');
  } else if (!isValidEmail(data.guest_email.trim())) {
    errors.push('Please provide a valid email address');
  }
  
  // Validate notes (optional)
  if (data.notes && typeof data.notes === 'string' && data.notes.length > 1000) {
    errors.push('Notes must be less than 1000 characters');
  }
  
  // Validate slot_id
  if (!data.slot_id || typeof data.slot_id !== 'string') {
    errors.push('Booking slot is required');
  }
  
  // Validate booking_date
  if (!data.booking_date || typeof data.booking_date !== 'string') {
    errors.push('Booking date is required');
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.booking_date)) {
      errors.push('Invalid date format');
    }
  }
  
  // Validate booking_time
  if (!data.booking_time || typeof data.booking_time !== 'string') {
    errors.push('Booking time is required');
  } else {
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(data.booking_time)) {
      errors.push('Invalid time format');
    }
  }
  
  if (errors.length > 0) {
    return { valid: false, errors };
  }
  
  // Return sanitized data
  return {
    valid: true,
    errors: [],
    sanitized: {
      guest_name: sanitizeText(data.guest_name.trim()),
      guest_email: data.guest_email.trim().toLowerCase(),
      notes: data.notes ? sanitizeText(data.notes.trim()) : null,
      slot_id: data.slot_id,
      booking_date: data.booking_date,
      booking_time: data.booking_time,
    }
  };
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    // Check IP-based rate limit first
    const ipRateLimit = checkRateLimit(`ip:${clientIP}`, MAX_REQUESTS_PER_IP);
    if (!ipRateLimit.allowed) {
      console.log('Rate limit exceeded for IP:', clientIP);
      return new Response(
        JSON.stringify({ error: 'Too many booking requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log('Received booking request:', JSON.stringify({
      slot_id: body.slot_id,
      booking_date: body.booking_date,
      booking_time: body.booking_time,
      guest_name_length: body.guest_name?.length,
      guest_email_domain: body.guest_email?.split('@')[1],
      notes_length: body.notes?.length,
      client_ip: clientIP
    }));

    // Validate and sanitize input
    const validation = validateBookingInput(body);
    
    if (!validation.valid) {
      console.log('Validation failed:', validation.errors);
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: validation.errors }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const sanitized = validation.sanitized!;

    // Check email-based rate limit
    const emailRateLimit = checkRateLimit(`email:${sanitized.guest_email}`, MAX_REQUESTS_PER_EMAIL);
    if (!emailRateLimit.allowed) {
      console.log('Rate limit exceeded for email:', sanitized.guest_email);
      return new Response(
        JSON.stringify({ error: 'Too many booking requests from this email. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }

    // Fetch the booking slot to get host_user_id and duration
    const { data: slotData, error: slotError } = await supabase
      .from('booking_slots')
      .select('id, user_id, is_active, host_email, title, duration_minutes, location')
      .eq('id', sanitized.slot_id)
      .eq('is_active', true)
      .single();

    if (slotError || !slotData) {
      console.log('Slot not found or inactive:', slotError);
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive booking slot' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check for duplicate bookings (same slot, date, time)
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('slot_id', sanitized.slot_id)
      .eq('booking_date', sanitized.booking_date)
      .eq('booking_time', sanitized.booking_time)
      .maybeSingle();

    if (existingBooking) {
      console.log('Duplicate booking attempt for slot/date/time');
      return new Response(
        JSON.stringify({ error: 'This time slot is already booked. Please choose another time.' }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert the booking
    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        slot_id: sanitized.slot_id,
        host_user_id: slotData.user_id,
        guest_name: sanitized.guest_name,
        guest_email: sanitized.guest_email,
        booking_date: sanitized.booking_date,
        booking_time: sanitized.booking_time,
        notes: sanitized.notes,
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Failed to create booking' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Booking created successfully:', bookingData.id);

    // Create Google Calendar event for the host (async, don't wait)
    try {
      const calendarEventPromise = fetch(`${supabaseUrl}/functions/v1/create-booking-calendar-event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          bookingId: bookingData.id,
          hostUserId: slotData.user_id,
          guestName: sanitized.guest_name,
          guestEmail: sanitized.guest_email,
          bookingDate: sanitized.booking_date,
          bookingTime: sanitized.booking_time,
          meetingTitle: slotData.title,
          durationMinutes: slotData.duration_minutes || 30,
          location: slotData.location,
          notes: sanitized.notes,
        }),
      });

      // Don't await - let it run in background
      calendarEventPromise.then(async (res) => {
        const result = await res.json();
        console.log('Calendar event creation result:', result);
      }).catch((err) => {
        console.error('Calendar event creation failed:', err);
      });
    } catch (calError) {
      console.error('Error triggering calendar event creation:', calError);
      // Don't fail the booking if calendar creation fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking: bookingData,
        // Return host_email at top level for notification, not exposed in public API
        hostEmail: slotData.host_email,
        slot: {
          title: slotData.title
        }
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in create-booking:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
