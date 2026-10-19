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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      batches: {
        Row: {
          capacity: number
          course_id: string
          created_at: string
          id: string
          mode: string
          name: string
          start_date: string | null
        }
        Insert: {
          capacity?: number
          course_id: string
          created_at?: string
          id?: string
          mode?: string
          name: string
          start_date?: string | null
        }
        Update: {
          capacity?: number
          course_id?: string
          created_at?: string
          id?: string
          mode?: string
          name?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      counselling_sessions: {
        Row: {
          counsellor_id: string | null
          created_at: string
          id: string
          lead_id: string | null
          mode: string
          notes: string | null
          outcome: string | null
          recommended_course_id: string | null
          scheduled_at: string
          status: string
          student_id: string | null
        }
        Insert: {
          counsellor_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          mode?: string
          notes?: string | null
          outcome?: string | null
          recommended_course_id?: string | null
          scheduled_at: string
          status?: string
          student_id?: string | null
        }
        Update: {
          counsellor_id?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          mode?: string
          notes?: string | null
          outcome?: string | null
          recommended_course_id?: string | null
          scheduled_at?: string
          status?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "counselling_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counselling_sessions_recommended_course_id_fkey"
            columns: ["recommended_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "counselling_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          duration_weeks: number
          exam: Database["public"]["Enums"]["exam_type"]
          fee: number
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          duration_weeks?: number
          exam: Database["public"]["Enums"]["exam_type"]
          fee?: number
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          duration_weeks?: number
          exam?: Database["public"]["Enums"]["exam_type"]
          fee?: number
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      enrolments: {
        Row: {
          batch_id: string | null
          course_id: string
          created_at: string
          enrolled_on: string
          fee_agreed: number | null
          id: string
          student_id: string
        }
        Insert: {
          batch_id?: string | null
          course_id: string
          created_at?: string
          enrolled_on?: string
          fee_agreed?: number | null
          id?: string
          student_id: string
        }
        Update: {
          batch_id?: string | null
          course_id?: string
          created_at?: string
          enrolled_on?: string
          fee_agreed?: number | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrolments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrolments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrolments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_events: {
        Row: {
          actor_id: string | null
          created_at: string
          detail: string | null
          event_type: string
          from_stage_id: string | null
          id: string
          lead_id: string | null
          student_id: string | null
          title: string
          to_stage_id: string | null
          visibility: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          detail?: string | null
          event_type: string
          from_stage_id?: string | null
          id?: string
          lead_id?: string | null
          student_id?: string | null
          title: string
          to_stage_id?: string | null
          visibility?: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          detail?: string | null
          event_type?: string
          from_stage_id?: string | null
          id?: string
          lead_id?: string | null
          student_id?: string | null
          title?: string
          to_stage_id?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_events_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "journey_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_events_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "journey_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_stages: {
        Row: {
          exam: Database["public"]["Enums"]["exam_type"]
          id: string
          is_terminal: boolean
          name: string
          position: number
        }
        Insert: {
          exam: Database["public"]["Enums"]["exam_type"]
          id?: string
          is_terminal?: boolean
          name: string
          position: number
        }
        Update: {
          exam?: Database["public"]["Enums"]["exam_type"]
          id?: string
          is_terminal?: boolean
          name?: string
          position?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          assigned_to: string | null
          city: string | null
          converted_student_id: string | null
          created_at: string
          current_score: string | null
          email: string | null
          exam: Database["public"]["Enums"]["exam_type"]
          full_name: string
          id: string
          interested_course_id: string | null
          is_demo: boolean
          lost_reason: string | null
          next_follow_up: string | null
          notes: string | null
          phone: string | null
          source: string
          status: Database["public"]["Enums"]["lead_status"]
          target_score: string | null
          target_year: number | null
          updated_at: string
          work_experience_months: number | null
        }
        Insert: {
          assigned_to?: string | null
          city?: string | null
          converted_student_id?: string | null
          created_at?: string
          current_score?: string | null
          email?: string | null
          exam: Database["public"]["Enums"]["exam_type"]
          full_name: string
          id?: string
          interested_course_id?: string | null
          is_demo?: boolean
          lost_reason?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          target_score?: string | null
          target_year?: number | null
          updated_at?: string
          work_experience_months?: number | null
        }
        Update: {
          assigned_to?: string | null
          city?: string | null
          converted_student_id?: string | null
          created_at?: string
          current_score?: string | null
          email?: string | null
          exam?: Database["public"]["Enums"]["exam_type"]
          full_name?: string
          id?: string
          interested_course_id?: string | null
          is_demo?: boolean
          lost_reason?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          source?: string
          status?: Database["public"]["Enums"]["lead_status"]
          target_score?: string | null
          target_year?: number | null
          updated_at?: string
          work_experience_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_fk"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_interested_course_id_fkey"
            columns: ["interested_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          city: string | null
          counsellor_id: string | null
          created_at: string
          email: string | null
          exam: Database["public"]["Enums"]["exam_type"]
          full_name: string
          id: string
          is_demo: boolean
          lead_id: string | null
          mentor_id: string | null
          phone: string | null
          planned_exam_date: string | null
          stage_id: string | null
          status: string
          target_score: string | null
          target_year: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          city?: string | null
          counsellor_id?: string | null
          created_at?: string
          email?: string | null
          exam: Database["public"]["Enums"]["exam_type"]
          full_name: string
          id?: string
          is_demo?: boolean
          lead_id?: string | null
          mentor_id?: string | null
          phone?: string | null
          planned_exam_date?: string | null
          stage_id?: string | null
          status?: string
          target_score?: string | null
          target_year?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          city?: string | null
          counsellor_id?: string | null
          created_at?: string
          email?: string | null
          exam?: Database["public"]["Enums"]["exam_type"]
          full_name?: string
          id?: string
          is_demo?: boolean
          lead_id?: string | null
          mentor_id?: string | null
          phone?: string | null
          planned_exam_date?: string | null
          stage_id?: string | null
          status?: string
          target_score?: string | null
          target_year?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "journey_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          due_date: string
          id: string
          lead_id: string | null
          priority: string
          status: Database["public"]["Enums"]["task_status"]
          student_id: string | null
          task_type: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string
          id?: string
          lead_id?: string | null
          priority?: string
          status?: Database["public"]["Enums"]["task_status"]
          student_id?: string | null
          task_type?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          due_date?: string
          id?: string
          lead_id?: string | null
          priority?: string
          status?: Database["public"]["Enums"]["task_status"]
          student_id?: string | null
          task_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      convert_lead: {
        Args: {
          _batch_id?: string
          _course_id: string
          _fee?: number
          _lead_id: string
        }
        Returns: string
      }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_leader: { Args: { _user_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      move_student_stage: {
        Args: { _note?: string; _stage_id: string; _student_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "director"
        | "counsellor"
        | "academic_manager"
        | "faculty"
        | "mentor"
        | "finance"
        | "student"
      exam_type: "CAT" | "GMAT"
      lead_status:
        | "new"
        | "contacted"
        | "counselling_scheduled"
        | "counselled"
        | "assessment"
        | "negotiation"
        | "converted"
        | "lost"
      task_status: "open" | "done" | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "super_admin",
        "director",
        "counsellor",
        "academic_manager",
        "faculty",
        "mentor",
        "finance",
        "student",
      ],
      exam_type: ["CAT", "GMAT"],
      lead_status: [
        "new",
        "contacted",
        "counselling_scheduled",
        "counselled",
        "assessment",
        "negotiation",
        "converted",
        "lost",
      ],
      task_status: ["open", "done", "cancelled"],
    },
  },
} as const
