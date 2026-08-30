// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          id: string
          location: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          location?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          location?: string | null
          title?: string
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string
          title?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string
          title?: string
        }
        Relationships: []
      }
      contact_inquiries: {
        Row: {
          created_at: string
          id: string
          instrument: string
          message: string
          name: string
          phone: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          instrument: string
          message?: string
          name: string
          phone: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          instrument?: string
          message?: string
          name?: string
          phone?: string
          status?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          category: string
          created_at: string
          file_path: string
          id: string
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          file_path: string
          id?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          file_path?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          birth_date: string | null
          city: string
          cpf: string
          disability_info: string | null
          dietary_restrictions: string | null
          diseases: string | null
          continuous_medications: string | null
          health_problems: string | null
          surgeries: string | null
          email: string
          full_name: string
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          instrument: string
          registration_number: string
          rg: string
          role: string
          state: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string
          cpf?: string
          disability_info?: string | null
          dietary_restrictions?: string | null
          diseases?: string | null
          continuous_medications?: string | null
          health_problems?: string | null
          surgeries?: string | null
          email?: string
          full_name?: string
          guardian_name?: string | null
          guardian_phone?: string | null
          id: string
          instrument?: string
          registration_number?: string
          rg?: string
          role?: string
          state?: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          city?: string
          cpf?: string
          disability_info?: string | null
          dietary_restrictions?: string | null
          diseases?: string | null
          continuous_medications?: string | null
          health_problems?: string | null
          surgeries?: string | null
          email?: string
          full_name?: string
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          instrument?: string
          registration_number?: string
          rg?: string
          role?: string
          state?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      travel_trips: {
        Row: {
          id: string
          title: string
          destination: string
          departure_at: string
          return_at: string | null
          description: string
          created_by: string | null
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          title: string
          destination?: string
          departure_at: string
          return_at?: string | null
          description?: string
          created_by?: string | null
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          destination?: string
          departure_at?: string
          return_at?: string | null
          description?: string
          created_by?: string | null
          created_at?: string
          is_active?: boolean
        }
        Relationships: []
      }
      travel_authorizations: {
        Row: {
          id: string
          trip_id: string
          member_id: string
          guardian_name: string
          guardian_phone: string
          guardian_document: string
          status: string
          signature_method: string
          signature_data: string | null
          signed_at: string | null
          signer_user_id: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          member_id: string
          guardian_name?: string
          guardian_phone?: string
          guardian_document?: string
          status?: string
          signature_method?: string
          signature_data?: string | null
          signed_at?: string | null
          signer_user_id?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          member_id?: string
          guardian_name?: string
          guardian_phone?: string
          guardian_document?: string
          status?: string
          signature_method?: string
          signature_data?: string | null
          signed_at?: string | null
          signer_user_id?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          created_at: string
          id: string
          is_system: boolean
          nav_label: string
          show_in_nav: boolean
          slug: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_system?: boolean
          nav_label: string
          show_in_nav?: boolean
          slug: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          is_system?: boolean
          nav_label?: string
          show_in_nav?: boolean
          slug?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      site_sections: {
        Row: {
          body: string
          created_at: string
          id: string
          is_visible: boolean
          link_label: string
          link_url: string
          media_url: string
          page_id: string
          section_type: string
          sort_order: number
          title: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          link_label?: string
          link_url?: string
          media_url?: string
          page_id: string
          section_type: string
          sort_order?: number
          title?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          link_label?: string
          link_url?: string
          media_url?: string
          page_id?: string
          section_type?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: 'site_sections_page_id_fkey'
            columns: ['page_id']
            isOneToOne: false
            referencedRelation: 'site_pages'
            referencedColumns: ['id']
          },
        ]
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      sponsor_inquiries: {
        Row: {
          company: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string
          status: string
        }
        Insert: {
          company?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name: string
          phone: string
          status?: string
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string
          status?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          kind: string
          logo_url: string
          name: string
          bg_type: string
          bg_color: string
          bg_color_end: string
          tier: string
          sort_order: number
          website_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          kind?: string
          logo_url?: string
          name: string
          bg_type?: string
          bg_color?: string
          bg_color_end?: string
          tier?: string
          sort_order?: number
          website_url?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          kind?: string
          logo_url?: string
          name?: string
          bg_type?: string
          bg_color?: string
          bg_color_end?: string
          tier?: string
          sort_order?: number
          website_url?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          is_public: boolean
          title: string
          video_url: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean
          title: string
          video_url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_public?: boolean
          title?: string
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      next_registration_number: { Args: never; Returns: string }
      verify_id_card: {
        Args: { member_id: string }
        Returns: {
          avatar_url: string | null
          birth_date: string | null
          city: string
          cpf: string
          disability_info: string | null
          full_name: string
          guardian_name: string | null
          guardian_phone: string | null
          instrument: string
          is_valid: boolean
          registration_number: string
          rg: string
          role: string
          state: string
          valid_until: string | null
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
