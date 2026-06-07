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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      autopilot_schedules: {
        Row: {
          active: boolean
          cadence: string
          category: string
          created_at: string
          home_id: string
          id: string
          last_run_at: string | null
          next_run_at: string
          notes: string | null
          owner_id: string
          preferred_partner_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          cadence?: string
          category: string
          created_at?: string
          home_id: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string
          notes?: string | null
          owner_id: string
          preferred_partner_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          cadence?: string
          category?: string
          created_at?: string
          home_id?: string
          id?: string
          last_run_at?: string | null
          next_run_at?: string
          notes?: string | null
          owner_id?: string
          preferred_partner_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      booking_events: {
        Row: {
          actor_id: string | null
          booking_id: string
          created_at: string
          event_type: string
          id: string
          payload: Json | null
        }
        Insert: {
          actor_id?: string | null
          booking_id: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
        }
        Update: {
          actor_id?: string | null
          booking_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_messages: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          id: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          body: string
          booking_id: string
          created_at?: string
          id?: string
          sender_id: string
          sender_role?: string
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          autopilot_schedule_id: string | null
          category: string
          completed_at: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          final_cost: number | null
          home_id: string
          id: string
          is_recurring: boolean
          notes: string | null
          owner_id: string
          partner_id: string | null
          photo_urls: string[]
          provider_id: string | null
          public_token: string | null
          realtor_id: string | null
          scheduled_at: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          autopilot_schedule_id?: string | null
          category: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          home_id: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          owner_id: string
          partner_id?: string | null
          photo_urls?: string[]
          provider_id?: string | null
          public_token?: string | null
          realtor_id?: string | null
          scheduled_at?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          autopilot_schedule_id?: string | null
          category?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          final_cost?: number | null
          home_id?: string
          id?: string
          is_recurring?: boolean
          notes?: string | null
          owner_id?: string
          partner_id?: string | null
          photo_urls?: string[]
          provider_id?: string | null
          public_token?: string | null
          realtor_id?: string | null
          scheduled_at?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_equipment: {
        Row: {
          brand: string | null
          category: string
          created_at: string
          expected_lifespan_months: number | null
          home_id: string
          id: string
          install_date: string | null
          last_serviced_at: string | null
          model: string | null
          name: string
          notes: string | null
          owner_id: string
          partner_category: string | null
          photo_url: string | null
          service_interval_months: number | null
          type: string
          updated_at: string
        }
        Insert: {
          brand?: string | null
          category?: string
          created_at?: string
          expected_lifespan_months?: number | null
          home_id: string
          id?: string
          install_date?: string | null
          last_serviced_at?: string | null
          model?: string | null
          name: string
          notes?: string | null
          owner_id: string
          partner_category?: string | null
          photo_url?: string | null
          service_interval_months?: number | null
          type: string
          updated_at?: string
        }
        Update: {
          brand?: string | null
          category?: string
          created_at?: string
          expected_lifespan_months?: number | null
          home_id?: string
          id?: string
          install_date?: string | null
          last_serviced_at?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          partner_category?: string | null
          photo_url?: string | null
          service_interval_months?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      homes: {
        Row: {
          address: string | null
          climate_zone: string | null
          created_at: string
          foundation_type: string | null
          home_type: string
          hvac_type: string | null
          id: string
          owner_id: string
          realtor_id: string | null
          updated_at: string
          year_built: number | null
        }
        Insert: {
          address?: string | null
          climate_zone?: string | null
          created_at?: string
          foundation_type?: string | null
          home_type?: string
          hvac_type?: string | null
          id?: string
          owner_id: string
          realtor_id?: string | null
          updated_at?: string
          year_built?: number | null
        }
        Update: {
          address?: string | null
          climate_zone?: string | null
          created_at?: string
          foundation_type?: string | null
          home_type?: string
          hvac_type?: string | null
          id?: string
          owner_id?: string
          realtor_id?: string | null
          updated_at?: string
          year_built?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "homes_realtor_id_fkey"
            columns: ["realtor_id"]
            isOneToOne: false
            referencedRelation: "realtors"
            referencedColumns: ["user_id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          owner_id: string
          paid_at: string | null
          pdf_url: string | null
          realtor_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          owner_id: string
          paid_at?: string | null
          pdf_url?: string | null
          realtor_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          owner_id?: string
          paid_at?: string | null
          pdf_url?: string | null
          realtor_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_credits: {
        Row: {
          amount_cents: number
          currency: string
          environment: string
          expires_at: string | null
          granted_at: string
          id: string
          member_year: number
          owner_id: string
          redeemed_at: string | null
          redeemed_booking_id: string | null
          status: string
          stripe_subscription_id: string | null
        }
        Insert: {
          amount_cents: number
          currency?: string
          environment?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          member_year: number
          owner_id: string
          redeemed_at?: string | null
          redeemed_booking_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
        }
        Update: {
          amount_cents?: number
          currency?: string
          environment?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          member_year?: number
          owner_id?: string
          redeemed_at?: string | null
          redeemed_booking_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
        }
        Relationships: []
      }
      maintenance_logs: {
        Row: {
          completed_at: string
          cost: number | null
          created_at: string
          home_id: string
          id: string
          notes: string | null
          owner_id: string
          partner_id: string | null
          performed_by: string
          photo_url: string | null
          season: string | null
          task_key: string | null
          title: string
        }
        Insert: {
          completed_at?: string
          cost?: number | null
          created_at?: string
          home_id: string
          id?: string
          notes?: string | null
          owner_id: string
          partner_id?: string | null
          performed_by?: string
          photo_url?: string | null
          season?: string | null
          task_key?: string | null
          title: string
        }
        Update: {
          completed_at?: string
          cost?: number | null
          created_at?: string
          home_id?: string
          id?: string
          notes?: string | null
          owner_id?: string
          partner_id?: string | null
          performed_by?: string
          photo_url?: string | null
          season?: string | null
          task_key?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          category: string
          created_at: string
          discount_code: string | null
          email: string | null
          hours: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          realtor_id: string
          response_time: string | null
          service_area: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          discount_code?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          realtor_id: string
          response_time?: string | null
          service_area?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          discount_code?: string | null
          email?: string | null
          hours?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          realtor_id?: string
          response_time?: string | null
          service_area?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_realtor_id_fkey"
            columns: ["realtor_id"]
            isOneToOne: false
            referencedRelation: "realtors"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          phone: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          phone?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      realtor_bounties: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          environment: string
          homeowner_id: string
          id: string
          notes: string | null
          paid_at: string | null
          realtor_id: string
          status: string
          stripe_subscription_id: string | null
          tier: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          environment?: string
          homeowner_id: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          realtor_id: string
          status?: string
          stripe_subscription_id?: string | null
          tier: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          environment?: string
          homeowner_id?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          realtor_id?: string
          status?: string
          stripe_subscription_id?: string | null
          tier?: string
        }
        Relationships: []
      }
      realtor_commission_rates: {
        Row: {
          category: string
          created_at: string
          flat_fee: number | null
          id: string
          rate_percent: number
          realtor_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          flat_fee?: number | null
          id?: string
          rate_percent?: number
          realtor_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          flat_fee?: number | null
          id?: string
          rate_percent?: number
          realtor_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      realtors: {
        Row: {
          brand_color: string
          company_name: string
          created_at: string
          logo_url: string | null
          referral_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_color?: string
          company_name?: string
          created_at?: string
          logo_url?: string | null
          referral_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_color?: string
          company_name?: string
          created_at?: string
          logo_url?: string | null
          referral_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          category: string
          created_at: string
          fee_amount: number | null
          fee_status: string
          homeowner_id: string
          id: string
          notes: string | null
          partner_id: string
          realtor_id: string
          triage_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          fee_amount?: number | null
          fee_status?: string
          homeowner_id: string
          id?: string
          notes?: string | null
          partner_id: string
          realtor_id: string
          triage_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          fee_amount?: number | null
          fee_status?: string
          homeowner_id?: string
          id?: string
          notes?: string | null
          partner_id?: string
          realtor_id?: string
          triage_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_realtor_id_fkey"
            columns: ["realtor_id"]
            isOneToOne: false
            referencedRelation: "realtors"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_triage_id_fkey"
            columns: ["triage_id"]
            isOneToOne: false
            referencedRelation: "triage_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_providers: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          email: string | null
          google_place_id: string | null
          id: string
          insured: boolean
          is_premium_only: boolean
          licensed: boolean
          name: string
          phone: string | null
          photo_urls: string[]
          rating: number | null
          response_time_minutes: number | null
          review_count: number
          service_area: string | null
          sort_rank: number
          updated_at: string
          verified: boolean
          website: string | null
          years_in_business: number | null
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          description?: string | null
          email?: string | null
          google_place_id?: string | null
          id?: string
          insured?: boolean
          is_premium_only?: boolean
          licensed?: boolean
          name: string
          phone?: string | null
          photo_urls?: string[]
          rating?: number | null
          response_time_minutes?: number | null
          review_count?: number
          service_area?: string | null
          sort_rank?: number
          updated_at?: string
          verified?: boolean
          website?: string | null
          years_in_business?: number | null
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          email?: string | null
          google_place_id?: string | null
          id?: string
          insured?: boolean
          is_premium_only?: boolean
          licensed?: boolean
          name?: string
          phone?: string | null
          photo_urls?: string[]
          rating?: number | null
          response_time_minutes?: number | null
          review_count?: number
          service_area?: string | null
          sort_rank?: number
          updated_at?: string
          verified?: boolean
          website?: string | null
          years_in_business?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      triage_requests: {
        Row: {
          category: string
          created_at: string
          description: string | null
          home_id: string
          id: string
          owner_id: string
          partner_id: string | null
          photo_url: string | null
          severity: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          home_id: string
          id?: string
          owner_id: string
          partner_id?: string | null
          photo_url?: string | null
          severity?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          home_id?: string
          id?: string
          owner_id?: string
          partner_id?: string | null
          photo_url?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "triage_requests_home_id_fkey"
            columns: ["home_id"]
            isOneToOne: false
            referencedRelation: "homes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triage_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_member_tier: { Args: { _price_id: string }; Returns: string }
      get_realtor_brand: {
        Args: { _code: string }
        Returns: {
          brand_color: string
          company_name: string
          logo_url: string
        }[]
      }
      get_realtor_brand_by_id: {
        Args: { _user_id: string }
        Returns: {
          brand_color: string
          company_name: string
          logo_url: string
        }[]
      }
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      resolve_realtor_by_code: { Args: { _code: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
