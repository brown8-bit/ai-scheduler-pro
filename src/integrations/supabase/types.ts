export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      booking_slots: {
        Row: {
          available_days: number[] | null
          created_at: string
          duration_minutes: number
          end_hour: number
          host_email: string | null
          id: string
          is_active: boolean | null
          public_slug: string | null
          start_hour: number
          title: string
          user_id: string
        }
        Insert: {
          available_days?: number[] | null
          created_at?: string
          duration_minutes?: number
          end_hour?: number
          host_email?: string | null
          id?: string
          is_active?: boolean | null
          public_slug?: string | null
          start_hour?: number
          title?: string
          user_id: string
        }
        Update: {
          available_days?: number[] | null
          created_at?: string
          duration_minutes?: number
          end_hour?: number
          host_email?: string | null
          id?: string
          is_active?: boolean | null
          public_slug?: string | null
          start_hour?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          booking_date: string
          booking_time: string
          created_at: string
          guest_email: string
          guest_name: string
          host_user_id: string
          id: string
          notes: string | null
          slot_id: string | null
          status: string | null
        }
        Insert: {
          booking_date: string
          booking_time: string
          created_at?: string
          guest_email: string
          guest_name: string
          host_user_id: string
          id?: string
          notes?: string | null
          slot_id?: string | null
          status?: string | null
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string
          guest_email?: string
          guest_name?: string
          host_user_id?: string
          id?: string
          notes?: string | null
          slot_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "booking_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          credit_hours: number | null
          current_grade: number | null
          id: string
          is_active: boolean | null
          name: string
          semester: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_hours?: number | null
          current_grade?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          semester?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit_hours?: number | null
          current_grade?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          semester?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_habits: {
        Row: {
          created_at: string
          habit_icon: string
          habit_name: string
          habit_type: string
          id: string
          is_default: boolean | null
          points_value: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          habit_icon?: string
          habit_name: string
          habit_type: string
          id?: string
          is_default?: boolean | null
          points_value?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          habit_icon?: string
          habit_name?: string
          habit_type?: string
          id?: string
          is_default?: boolean | null
          points_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          name: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name: string
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      focus_blocks: {
        Row: {
          created_at: string
          days_of_week: number[] | null
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_of_week?: number[] | null
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[] | null
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      grades: {
        Row: {
          assignment_name: string
          category: string | null
          course_name: string
          created_at: string
          due_date: string | null
          grade_value: number | null
          id: string
          max_grade: number | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          assignment_name: string
          category?: string | null
          course_name: string
          created_at?: string
          due_date?: string | null
          grade_value?: number | null
          id?: string
          max_grade?: number | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          assignment_name?: string
          category?: string | null
          course_name?: string
          created_at?: string
          due_date?: string | null
          grade_value?: number | null
          id?: string
          max_grade?: number | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed_at: string
          completed_date: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          completed_date?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          completed_date?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "daily_habits"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          items: Json | null
          notes: string | null
          paid_date: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          items?: Json | null
          notes?: string | null
          paid_date?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          items?: Json | null
          notes?: string | null
          paid_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      limited_offers: {
        Row: {
          badge: string
          created_at: string
          description: string
          display_order: number | null
          expires_at: string | null
          gradient: string
          icon: string
          id: string
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          badge: string
          created_at?: string
          description: string
          display_order?: number | null
          expires_at?: string | null
          gradient?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          badge?: string
          created_at?: string
          description?: string
          display_order?: number | null
          expires_at?: string | null
          gradient?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          is_read: boolean | null
          post_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          post_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          post_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_sessions: {
        Row: {
          completed_at: string
          duration_minutes: number
          id: string
          notes: string | null
          session_type: string | null
          task_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          session_type?: string | null
          task_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          session_type?: string | null
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pomodoro_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reposts: {
        Row: {
          created_at: string
          id: string
          is_quote: boolean
          original_post_id: string
          quote_text: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_quote?: boolean
          original_post_id: string
          quote_text?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_quote?: boolean
          original_post_id?: string
          quote_text?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reposts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          is_lifetime: boolean | null
          is_verified: boolean | null
          referral_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_lifetime?: boolean | null
          is_verified?: boolean | null
          referral_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_lifetime?: boolean | null
          is_verified?: boolean | null
          referral_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          coupon_code: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_claimed: boolean | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_claimed?: boolean | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          reward_claimed?: boolean | null
          status?: string
        }
        Relationships: []
      }
      scheduled_events: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          event_date: string
          id: string
          is_completed: boolean | null
          is_recurring: boolean | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          reminder: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reminder?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          is_completed?: boolean | null
          is_recurring?: boolean | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reminder?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          achievement_data: Json | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          post_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_data?: Json | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          post_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_data?: Json | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          post_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          event_id: string | null
          id: string
          is_completed: boolean | null
          priority: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          is_completed?: boolean | null
          priority?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "scheduled_events"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          color: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_schedules: {
        Row: {
          created_at: string
          end_time: string
          id: string
          notes: string | null
          start_time: string
          team_member_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          start_time: string
          team_member_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          start_time?: string
          team_member_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_schedules_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string
          current_level: number | null
          id: string
          total_xp: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: number | null
          id?: string
          total_xp?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: number | null
          id?: string
          total_xp?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          total_events_completed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          total_events_completed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          total_events_completed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_usage: {
        Row: {
          ai_requests_count: number
          created_at: string
          id: string
          month_year: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_requests_count?: number
          created_at?: string
          id?: string
          month_year: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_requests_count?: number
          created_at?: string
          id?: string
          month_year?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      voice_notes: {
        Row: {
          audio_url: string
          created_at: string
          duration_seconds: number | null
          id: string
          title: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          title?: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          duration_seconds?: number | null
          id?: string
          title?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_xp: {
        Args: { p_user_id: string; p_xp_amount: number }
        Returns: Json
      }
      get_booking_slot_host_email: {
        Args: { slot_id_param: string }
        Returns: string
      }
      get_leaderboard_data: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          current_streak: number
          display_name: string
          rank_position: number
          total_events_completed: number
        }[]
      }
      get_or_create_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      get_public_booking_slot: {
        Args: { slug_param: string }
        Returns: {
          available_days: number[]
          duration_minutes: number
          end_hour: number
          id: string
          is_active: boolean
          public_slug: string
          start_hour: number
          title: string
        }[]
      }
      get_user_usage: { Args: { p_user_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ai_usage: {
        Args: { p_limit: number; p_user_id: string }
        Returns: Json
      }
      is_display_name_available: {
        Args: { p_current_user_id?: string; p_display_name: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
