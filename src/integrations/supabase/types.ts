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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      class_attendance: {
        Row: {
          attendance: string
          class_session_id: string
          id: string
          note: string | null
          student_id: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          attendance?: string
          class_session_id: string
          id?: string
          note?: string | null
          student_id: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          attendance?: string
          class_session_id?: string
          id?: string
          note?: string | null
          student_id?: string
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_attendance_class_session_id_fkey"
            columns: ["class_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_attendance_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      class_homework: {
        Row: {
          body_json: Json
          class_session_id: string
          created_at: string
          id: string
          status: string
          studio_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          body_json?: Json
          class_session_id: string
          created_at?: string
          id?: string
          status?: string
          studio_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          body_json?: Json
          class_session_id?: string
          created_at?: string
          id?: string
          status?: string
          studio_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_homework_class_session_id_fkey"
            columns: ["class_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_homework_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      class_homework_completion: {
        Row: {
          body_json: Json
          class_homework_id: string
          id: string
          status: string
          student_id: string
          studio_id: string | null
          updated_at: string
        }
        Insert: {
          body_json?: Json
          class_homework_id: string
          id?: string
          status?: string
          student_id: string
          studio_id?: string | null
          updated_at?: string
        }
        Update: {
          body_json?: Json
          class_homework_id?: string
          id?: string
          status?: string
          student_id?: string
          studio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_homework_completion_class_homework_id_fkey"
            columns: ["class_homework_id"]
            isOneToOne: false
            referencedRelation: "class_homework"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_homework_completion_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_homework_completion_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          status: string
          student_id: string
          studio_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          status?: string
          student_id: string
          studio_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          status?: string
          student_id?: string
          studio_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_members_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      class_session_notes: {
        Row: {
          class_session_id: string
          created_at: string
          id: string
          notes_text: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          class_session_id: string
          created_at?: string
          id?: string
          notes_text?: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          class_session_id?: string
          created_at?: string
          id?: string
          notes_text?: string
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_session_notes_class_session_id_fkey"
            columns: ["class_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_session_notes_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          class_id: string
          created_at: string
          ends_at: string
          id: string
          starts_at: string
          status: string
          studio_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          ends_at: string
          id?: string
          starts_at: string
          status?: string
          studio_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          starts_at?: string
          status?: string
          studio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          capacity: number | null
          created_at: string
          default_day: string | null
          default_time: string | null
          duration_minutes: number
          id: string
          name: string
          status: string
          studio_id: string
          teacher_user_id: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          default_day?: string | null
          default_time?: string | null
          duration_minutes?: number
          id?: string
          name: string
          status?: string
          studio_id: string
          teacher_user_id: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          default_day?: string | null
          default_time?: string | null
          duration_minutes?: number
          id?: string
          name?: string
          status?: string
          studio_id?: string
          teacher_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          class_id: string | null
          class_session_id: string | null
          created_at: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          lesson_id: string | null
          mime_type: string | null
          name: string
          student_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          class_id?: string | null
          class_session_id?: string | null
          created_at?: string
          file_path: string
          file_size?: number | null
          file_type?: string
          id?: string
          lesson_id?: string | null
          mime_type?: string | null
          name: string
          student_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          class_id?: string | null
          class_session_id?: string | null
          created_at?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          lesson_id?: string | null
          mime_type?: string | null
          name?: string
          student_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "files_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_class_session_id_fkey"
            columns: ["class_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "files_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_assignments: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          items: Json
          lesson_id: string | null
          status: string
          student_id: string
          studio_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          items?: Json
          lesson_id?: string | null
          status?: string
          student_id: string
          studio_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          items?: Json
          lesson_id?: string | null
          status?: string
          student_id?: string
          studio_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_assignments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_assignments_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          source?: string | null
        }
        Relationships: []
      }
      lesson_requests: {
        Row: {
          admin_notes: string | null
          child_age: number | null
          child_name: string
          created_at: string
          id: string
          notes: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          parent_user_id: string
          preferred_day: string | null
          preferred_level: string
          preferred_time: string | null
          reviewed_at: string | null
          status: string
          studio_id: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          child_age?: number | null
          child_name: string
          created_at?: string
          id?: string
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_user_id: string
          preferred_day?: string | null
          preferred_level?: string
          preferred_time?: string | null
          reviewed_at?: string | null
          status?: string
          studio_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          child_age?: number | null
          child_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_user_id?: string
          preferred_day?: string | null
          preferred_level?: string
          preferred_time?: string | null
          reviewed_at?: string | null
          status?: string
          studio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_requests_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          attendance: string
          created_at: string
          date: string
          homework: string | null
          id: string
          notes: string | null
          pieces: string[] | null
          student_id: string
          updated_at: string
        }
        Insert: {
          attendance?: string
          created_at?: string
          date?: string
          homework?: string | null
          id?: string
          notes?: string | null
          pieces?: string[] | null
          student_id: string
          updated_at?: string
        }
        Update: {
          attendance?: string
          created_at?: string
          date?: string
          homework?: string | null
          id?: string
          notes?: string | null
          pieces?: string[] | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          created_at: string
          id: string
          student_id: string
          studio_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          student_id: string
          studio_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          student_id?: string
          studio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_user_id: string
          studio_id: string | null
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_user_id: string
          studio_id?: string | null
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_user_id?: string
          studio_id?: string | null
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_logs: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          logged_by: string | null
          notes: string | null
          practice_date: string
          student_id: string
          studio_id: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          logged_by?: string | null
          notes?: string | null
          practice_date?: string
          student_id: string
          studio_id?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          logged_by?: string | null
          notes?: string | null
          practice_date?: string
          student_id?: string
          studio_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_logs_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recap_messages: {
        Row: {
          body_html: string
          class_id: string | null
          class_session_id: string | null
          created_at: string
          email_to: string | null
          id: string
          lesson_id: string | null
          sent_by_user_id: string | null
          status: string
          student_id: string | null
          studio_id: string | null
          subject: string
        }
        Insert: {
          body_html?: string
          class_id?: string | null
          class_session_id?: string | null
          created_at?: string
          email_to?: string | null
          id?: string
          lesson_id?: string | null
          sent_by_user_id?: string | null
          status?: string
          student_id?: string | null
          studio_id?: string | null
          subject?: string
        }
        Update: {
          body_html?: string
          class_id?: string | null
          class_session_id?: string | null
          created_at?: string
          email_to?: string | null
          id?: string
          lesson_id?: string | null
          sent_by_user_id?: string | null
          status?: string
          student_id?: string | null
          studio_id?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "recap_messages_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recap_messages_class_session_id_fkey"
            columns: ["class_session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recap_messages_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recap_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recap_messages_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      score_annotations: {
        Row: {
          annotations: Json
          created_at: string
          created_by: string | null
          file_id: string
          id: string
          page_number: number
          updated_at: string
        }
        Insert: {
          annotations?: Json
          created_at?: string
          created_by?: string | null
          file_id: string
          id?: string
          page_number?: number
          updated_at?: string
        }
        Update: {
          annotations?: Json
          created_at?: string
          created_by?: string | null
          file_id?: string
          id?: string
          page_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_annotations_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "files"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          age: number | null
          created_at: string
          current_piece: string | null
          id: string
          internal_label: string | null
          lesson_day: string | null
          lesson_request_id: string | null
          lesson_time: string | null
          level: string
          meeting_url: string | null
          name: string
          notes: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          parent_user_id: string | null
          status: string
          studio_id: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          current_piece?: string | null
          id?: string
          internal_label?: string | null
          lesson_day?: string | null
          lesson_request_id?: string | null
          lesson_time?: string | null
          level?: string
          meeting_url?: string | null
          name: string
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_user_id?: string | null
          status?: string
          studio_id?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          current_piece?: string | null
          id?: string
          internal_label?: string | null
          lesson_day?: string | null
          lesson_request_id?: string | null
          lesson_time?: string | null
          level?: string
          meeting_url?: string | null
          name?: string
          notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_user_id?: string | null
          status?: string
          studio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_lesson_request_id_fkey"
            columns: ["lesson_request_id"]
            isOneToOne: false
            referencedRelation: "lesson_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_email_templates: {
        Row: {
          billing_mode: string
          body: string
          created_at: string
          id: string
          reply_to_email: string | null
          studio_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          billing_mode?: string
          body?: string
          created_at?: string
          id?: string
          reply_to_email?: string | null
          studio_id: string
          subject?: string
          updated_at?: string
        }
        Update: {
          billing_mode?: string
          body?: string
          created_at?: string
          id?: string
          reply_to_email?: string | null
          studio_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_email_templates_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: true
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
      studios: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean
          name: string
          owner_user_id: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean
          name: string
          owner_user_id: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean
          name?: string
          owner_user_id?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          studio_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          studio_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          studio_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_studio_id_fkey"
            columns: ["studio_id"]
            isOneToOne: false
            referencedRelation: "studios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_studio_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_studio: { Args: { _studio_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "parent"
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
      app_role: ["admin", "parent"],
    },
  },
} as const
