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
      [_ in never]: never
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
