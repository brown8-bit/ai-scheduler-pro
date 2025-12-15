import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      notes_length: body.notes?.length
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

    // Fetch the booking slot to get host_user_id
    const { data: slotData, error: slotError } = await supabase
      .from('booking_slots')
      .select('id, user_id, is_active, host_email, title')
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
