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
      absence_notifications_log: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          school_id: string | null
          sent_at: string
          sent_count: number
          session_date: string
          student_id: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          school_id?: string | null
          sent_at?: string
          sent_count?: number
          session_date: string
          student_id?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          school_id?: string | null
          sent_at?: string
          sent_count?: number
          session_date?: string
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "absence_notifications_log_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "absence_notifications_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          class_id: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          pinned: boolean
          school_id: string | null
          starts_at: string | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          body: string
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          pinned?: boolean
          school_id?: string | null
          starts_at?: string | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          body?: string
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          pinned?: boolean
          school_id?: string | null
          starts_at?: string | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          absence_notification_sent: boolean | null
          class_id: string
          created_at: string
          description: string | null
          due_date: string | null
          end_time: string | null
          id: string
          is_recurring: boolean | null
          is_rescheduled: boolean | null
          original_session_date: string | null
          parent_assignment_id: string | null
          proposed_new_date: string | null
          recurrence_day: number | null
          recurrence_end_date: string | null
          recurrence_pattern: string | null
          reschedule_reason: string | null
          reschedule_status: string | null
          rescheduled_at: string | null
          rescheduled_by: string | null
          school_id: string
          school_year_id: string
          session_date: string | null
          start_time: string | null
          subject_id: string | null
          teacher_id: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          absence_notification_sent?: boolean | null
          class_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          end_time?: string | null
          id?: string
          is_recurring?: boolean | null
          is_rescheduled?: boolean | null
          original_session_date?: string | null
          parent_assignment_id?: string | null
          proposed_new_date?: string | null
          recurrence_day?: number | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reschedule_reason?: string | null
          reschedule_status?: string | null
          rescheduled_at?: string | null
          rescheduled_by?: string | null
          school_id: string
          school_year_id: string
          session_date?: string | null
          start_time?: string | null
          subject_id?: string | null
          teacher_id: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          absence_notification_sent?: boolean | null
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          end_time?: string | null
          id?: string
          is_recurring?: boolean | null
          is_rescheduled?: boolean | null
          original_session_date?: string | null
          parent_assignment_id?: string | null
          proposed_new_date?: string | null
          recurrence_day?: number | null
          recurrence_end_date?: string | null
          recurrence_pattern?: string | null
          reschedule_reason?: string | null
          reschedule_status?: string | null
          rescheduled_at?: string | null
          rescheduled_by?: string | null
          school_id?: string
          school_year_id?: string
          session_date?: string | null
          start_time?: string | null
          subject_id?: string | null
          teacher_id?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_parent_assignment_id_fkey"
            columns: ["parent_assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignments_class_id"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignments_school_id"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assignments_teacher_id"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          assignment_id: string | null
          class_id: string
          created_at: string
          date: string
          id: string
          marked_at: string | null
          method: string
          school_year_id: string
          status: string
          student_id: string
          subject_id: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          assignment_id?: string | null
          class_id: string
          created_at?: string
          date?: string
          id?: string
          marked_at?: string | null
          method?: string
          school_year_id: string
          status?: string
          student_id: string
          subject_id?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string | null
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          marked_at?: string | null
          method?: string
          school_year_id?: string
          status?: string
          student_id?: string
          subject_id?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_attendance_class_id"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          class_id: string
          created_at: string
          date: string
          expires_at: string
          id: string
          is_active: boolean
          session_code: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          expires_at: string
          id?: string
          is_active?: boolean
          session_code: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          session_code?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      class_subjects: {
        Row: {
          class_id: string
          created_at: string
          id: string
          subject_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          subject_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      class_transitions: {
        Row: {
          created_at: string
          from_class_id: string
          id: string
          preparation_id: string
          to_class_id: string
        }
        Insert: {
          created_at?: string
          from_class_id: string
          id?: string
          preparation_id: string
          to_class_id: string
        }
        Update: {
          created_at?: string
          from_class_id?: string
          id?: string
          preparation_id?: string
          to_class_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_transitions_from_class_id_fkey"
            columns: ["from_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_transitions_preparation_id_fkey"
            columns: ["preparation_id"]
            isOneToOne: false
            referencedRelation: "year_preparations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_transitions_to_class_id_fkey"
            columns: ["to_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          created_at: string
          cycle_id: string | null
          id: string
          is_specialization: boolean | null
          name: string
          option_id: string | null
          school_id: string
          school_year_id: string
          updated_at: string
          year_level: number | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          created_at?: string
          cycle_id?: string | null
          id?: string
          is_specialization?: boolean | null
          name: string
          option_id?: string | null
          school_id: string
          school_year_id: string
          updated_at?: string
          year_level?: number | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          created_at?: string
          cycle_id?: string | null
          id?: string
          is_specialization?: boolean | null
          name?: string
          option_id?: string | null
          school_id?: string
          school_year_id?: string
          updated_at?: string
          year_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_assignments: {
        Row: {
          assignment_id: string
          classroom_id: string
          created_at: string
          id: string
          school_id: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          classroom_id: string
          created_at?: string
          id?: string
          school_id: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          classroom_id?: string
          created_at?: string
          id?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_assignments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_assignments_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          building: string | null
          capacity: number
          created_at: string
          equipment: string[] | null
          floor: string | null
          id: string
          is_active: boolean
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          building?: string | null
          capacity?: number
          created_at?: string
          equipment?: string[] | null
          floor?: string | null
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          building?: string | null
          capacity?: number
          created_at?: string
          equipment?: string[] | null
          floor?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      cycles: {
        Row: {
          created_at: string
          description: string | null
          duration_years: number | null
          id: string
          is_active: boolean
          level: string | null
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_years?: number | null
          id?: string
          is_active?: boolean
          level?: string | null
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_years?: number | null
          id?: string
          is_active?: boolean
          level?: string | null
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      document_request_tracking: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          request_id: string
          school_id: string
          status: string
          student_id: string
          updated_by: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          request_id: string
          school_id: string
          status: string
          student_id: string
          updated_by?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          request_id?: string
          school_id?: string
          status?: string
          student_id?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_request_tracking_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "document_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_request_tracking_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_request_tracking_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      document_requests: {
        Row: {
          created_at: string
          document_type: string
          id: string
          reason: string | null
          school_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type: string
          id?: string
          reason?: string | null
          school_id: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          id?: string
          reason?: string | null
          school_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          content: string
          created_at: string
          footer_color: string | null
          footer_content: string | null
          header_style: string | null
          id: string
          is_active: boolean
          name: string
          school_id: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          footer_color?: string | null
          footer_content?: string | null
          header_style?: string | null
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          footer_color?: string | null
          footer_content?: string | null
          header_style?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string
          id: string
          location: string | null
          published: boolean
          school_id: string | null
          scope: string
          start_at: string
          subject_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at: string
          id?: string
          location?: string | null
          published?: boolean
          school_id?: string | null
          scope?: string
          start_at: string
          subject_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string
          id?: string
          location?: string | null
          published?: boolean
          school_id?: string | null
          scope?: string
          start_at?: string
          subject_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_answers: {
        Row: {
          answer_text: string
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
        }
        Insert: {
          answer_text: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id: string
        }
        Update: {
          answer_text?: string
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_documents: {
        Row: {
          answer_on_document: boolean | null
          class_id: string
          created_at: string
          documents_allowed: boolean
          duration_minutes: number
          exam_type: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          school_id: string
          school_semester_id: string | null
          school_year_id: string
          status: string
          subject_id: string
          submitted_at: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          answer_on_document?: boolean | null
          class_id: string
          created_at?: string
          documents_allowed?: boolean
          duration_minutes: number
          exam_type: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id: string
          school_semester_id?: string | null
          school_year_id: string
          status?: string
          subject_id: string
          submitted_at?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          answer_on_document?: boolean | null
          class_id?: string
          created_at?: string
          documents_allowed?: boolean
          duration_minutes?: number
          exam_type?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id?: string
          school_semester_id?: string | null
          school_year_id?: string
          status?: string
          subject_id?: string
          submitted_at?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_documents_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "exam_documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_documents_school_semester_id_fkey"
            columns: ["school_semester_id"]
            isOneToOne: false
            referencedRelation: "school_semester"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_documents_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_documents_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_documents_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          created_at: string
          exam_document_id: string
          has_choices: boolean
          id: string
          is_multiple_choice: boolean
          points: number
          question_number: number
          question_text: string
          table_data: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          exam_document_id: string
          has_choices?: boolean
          id?: string
          is_multiple_choice?: boolean
          points: number
          question_number: number
          question_text: string
          table_data?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          exam_document_id?: string
          has_choices?: boolean
          id?: string
          is_multiple_choice?: boolean
          points?: number
          question_number?: number
          question_text?: string
          table_data?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_document_id_fkey"
            columns: ["exam_document_id"]
            isOneToOne: false
            referencedRelation: "exam_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          comment: string | null
          created_at: string
          exam_date: string | null
          grade: number
          grade_type: string
          id: string
          school_semester_id: string | null
          school_year_id: string
          student_id: string
          subject_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          exam_date?: string | null
          grade: number
          grade_type?: string
          id?: string
          school_semester_id?: string | null
          school_year_id: string
          student_id: string
          subject_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          exam_date?: string | null
          grade?: number
          grade_type?: string
          id?: string
          school_semester_id?: string | null
          school_year_id?: string
          student_id?: string
          subject_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grades_school_semester_id_fkey"
            columns: ["school_semester_id"]
            isOneToOne: false
            referencedRelation: "school_semester"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grades_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      options: {
        Row: {
          code: string | null
          created_at: string
          cycle_id: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          cycle_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          cycle_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "options_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "options_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_notifications: {
        Row: {
          class_id: string | null
          created_at: string
          id: string
          message: string
          recipient_email: string
          recipient_name: string
          recipient_type: string
          school_id: string
          sent_at: string
          sent_by: string | null
          subject: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          id?: string
          message: string
          recipient_email: string
          recipient_name: string
          recipient_type: string
          school_id: string
          sent_at?: string
          sent_by?: string | null
          subject: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          id?: string
          message?: string
          recipient_email?: string
          recipient_name?: string
          recipient_type?: string
          school_id?: string
          sent_at?: string
          sent_by?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_notifications_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_semester: {
        Row: {
          archived: boolean | null
          created_at: string | null
          end_date: string
          id: string
          is_actual: boolean | null
          is_next: boolean | null
          name: string
          school_id: string
          school_year_id: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          archived?: boolean | null
          created_at?: string | null
          end_date: string
          id?: string
          is_actual?: boolean | null
          is_next?: boolean | null
          name: string
          school_id: string
          school_year_id: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          archived?: boolean | null
          created_at?: string | null
          end_date?: string
          id?: string
          is_actual?: boolean | null
          is_next?: boolean | null
          name?: string
          school_id?: string
          school_year_id?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_semester_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_semester_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
        ]
      }
      school_years: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          is_current: boolean | null
          is_next: boolean | null
          name: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          is_current?: boolean | null
          is_next?: boolean | null
          name: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          is_current?: boolean | null
          is_next?: boolean | null
          name?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      schools: {
        Row: {
          academic_year: string | null
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          currency: string
          id: string
          identifier: string
          is_active: boolean
          logo_url: string | null
          name: string
          owner_id: string | null
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          academic_year?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          id?: string
          identifier: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          owner_id?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          academic_year?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          id?: string
          identifier?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          owner_id?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schools_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "user_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      student_accounts: {
        Row: {
          created_at: string
          email: string
          id: string
          invitation_expires_at: string | null
          invitation_token: string | null
          is_active: boolean
          password_hash: string | null
          school_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          is_active?: boolean
          password_hash?: string | null
          school_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invitation_expires_at?: string | null
          invitation_token?: string | null
          is_active?: boolean
          password_hash?: string | null
          school_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_accounts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_accounts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_school: {
        Row: {
          class_id: string
          created_at: string
          enrolled_at: string | null
          id: string
          is_active: boolean
          school_id: string
          school_year_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          enrolled_at?: string | null
          id?: string
          is_active?: boolean
          school_id: string
          school_year_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          enrolled_at?: string | null
          id?: string
          is_active?: boolean
          school_id?: string
          school_year_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_school_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_school_year_id_fkey"
            columns: ["school_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_school_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_transitions: {
        Row: {
          created_at: string
          created_by: string | null
          from_class_id: string
          id: string
          notes: string | null
          preparation_id: string
          student_id: string
          to_class_id: string | null
          transition_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_class_id: string
          id?: string
          notes?: string | null
          preparation_id: string
          student_id: string
          to_class_id?: string | null
          transition_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_class_id?: string
          id?: string
          notes?: string | null
          preparation_id?: string
          student_id?: string
          to_class_id?: string | null
          transition_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_transitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "student_transitions_from_class_id_fkey"
            columns: ["from_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transitions_preparation_id_fkey"
            columns: ["preparation_id"]
            isOneToOne: false
            referencedRelation: "year_preparations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transitions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transitions_to_class_id_fkey"
            columns: ["to_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          birth_date: string | null
          cin_number: string
          created_at: string
          email: string | null
          firstname: string
          id: string
          lastname: string
          parent_phone: string | null
          student_phone: string | null
          tutor_email: string | null
          tutor_name: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          birth_date?: string | null
          cin_number: string
          created_at?: string
          email?: string | null
          firstname: string
          id?: string
          lastname: string
          parent_phone?: string | null
          student_phone?: string | null
          tutor_email?: string | null
          tutor_name?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          birth_date?: string | null
          cin_number?: string
          created_at?: string
          email?: string | null
          firstname?: string
          id?: string
          lastname?: string
          parent_phone?: string | null
          student_phone?: string | null
          tutor_email?: string | null
          tutor_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subjects: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          class_id: string
          coefficient: number
          created_at: string
          id: string
          name: string
          school_id: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          class_id: string
          coefficient?: number
          created_at?: string
          id?: string
          name: string
          school_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          class_id?: string
          coefficient?: number
          created_at?: string
          id?: string
          name?: string
          school_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_subjects_school_id"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          is_active: boolean
          name: string
          type: Database["public"]["Enums"]["subscription_plan_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean
          name: string
          type: Database["public"]["Enums"]["subscription_plan_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          is_active?: boolean
          name?: string
          type?: Database["public"]["Enums"]["subscription_plan_type"]
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number | null
          auto_renew: boolean
          created_at: string
          created_by: string | null
          currency: string
          duration: Database["public"]["Enums"]["subscription_duration_type"]
          end_date: string
          id: string
          is_trial: boolean
          notes: string | null
          payment_method:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          plan_type: Database["public"]["Enums"]["subscription_plan_type"]
          school_id: string
          start_date: string
          status: Database["public"]["Enums"]["subscription_status_type"]
          transaction_id: string | null
          trial_end_date: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          auto_renew?: boolean
          created_at?: string
          created_by?: string | null
          currency?: string
          duration: Database["public"]["Enums"]["subscription_duration_type"]
          end_date: string
          id?: string
          is_trial?: boolean
          notes?: string | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          plan_type: Database["public"]["Enums"]["subscription_plan_type"]
          school_id: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status_type"]
          transaction_id?: string | null
          trial_end_date?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          auto_renew?: boolean
          created_at?: string
          created_by?: string | null
          currency?: string
          duration?: Database["public"]["Enums"]["subscription_duration_type"]
          end_date?: string
          id?: string
          is_trial?: boolean
          notes?: string | null
          payment_method?:
            | Database["public"]["Enums"]["payment_method_type"]
            | null
          plan_type?: Database["public"]["Enums"]["subscription_plan_type"]
          school_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status_type"]
          transaction_id?: string | null
          trial_end_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_classes: {
        Row: {
          class_id: string
          created_at: string
          id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_teacher_classes_class_id"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_teacher_classes_teacher_id"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          address: string | null
          archived: boolean | null
          archived_at: string | null
          assigned_classes_count: number | null
          birth_date: string | null
          created_at: string
          email: string | null
          firstname: string
          gender: string | null
          id: string
          join_date: string | null
          lastname: string
          mobile: string | null
          qualification: string | null
          salary: number | null
          school_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          archived?: boolean | null
          archived_at?: string | null
          assigned_classes_count?: number | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          firstname: string
          gender?: string | null
          id?: string
          join_date?: string | null
          lastname: string
          mobile?: string | null
          qualification?: string | null
          salary?: number | null
          school_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          archived?: boolean | null
          archived_at?: string | null
          assigned_classes_count?: number | null
          birth_date?: string | null
          created_at?: string
          email?: string | null
          firstname?: string
          gender?: string | null
          id?: string
          join_date?: string | null
          lastname?: string
          mobile?: string | null
          qualification?: string | null
          salary?: number | null
          school_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credentials: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_login: string | null
          last_name: string
          password_hash: string
          role: string
          school_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          last_name: string
          password_hash: string
          role?: string
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          last_name?: string
          password_hash?: string
          role?: string
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credentials_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      year_preparations: {
        Row: {
          classes_created_at: string | null
          created_at: string
          from_year_id: string
          id: string
          mapping_completed_at: string | null
          school_id: string
          status: string
          students_promoted_at: string | null
          to_year_id: string
          updated_at: string
        }
        Insert: {
          classes_created_at?: string | null
          created_at?: string
          from_year_id: string
          id?: string
          mapping_completed_at?: string | null
          school_id: string
          status?: string
          students_promoted_at?: string | null
          to_year_id: string
          updated_at?: string
        }
        Update: {
          classes_created_at?: string | null
          created_at?: string
          from_year_id?: string
          id?: string
          mapping_completed_at?: string | null
          school_id?: string
          status?: string
          students_promoted_at?: string | null
          to_year_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "year_preparations_from_year_id_fkey"
            columns: ["from_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "year_preparations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "year_preparations_to_year_id_fkey"
            columns: ["to_year_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_transition_semesters: { Args: never; Returns: undefined }
      check_classroom_availability: {
        Args: {
          p_assignment_id: string
          p_classroom_id: string
          p_school_id: string
        }
        Returns: boolean
      }
      create_next_school_year: {
        Args: { current_year_id: string }
        Returns: string
      }
      generate_random_password: { Args: { length?: number }; Returns: string }
      get_user_profile: {
        Args: { _user_id: string }
        Returns: {
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_current_school_year: { Args: { year_id: string }; Returns: undefined }
      set_current_semester: {
        Args: { semester_id: string }
        Returns: undefined
      }
      set_next_school_year: { Args: { year_id: string }; Returns: undefined }
    }
    Enums: {
      app_role:
        | "global_admin"
        | "school_admin"
        | "teacher"
        | "student"
        | "parent"
      payment_method_type: "cash" | "bank_transfer" | "check" | "card" | "other"
      subscription_duration_type:
        | "1_month"
        | "3_months"
        | "6_months"
        | "1_year"
        | "2_years"
      subscription_plan_type: "basic" | "standard" | "premium"
      subscription_status_type: "trial" | "active" | "expired" | "cancelled"
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
      app_role: [
        "global_admin",
        "school_admin",
        "teacher",
        "student",
        "parent",
      ],
      payment_method_type: ["cash", "bank_transfer", "check", "card", "other"],
      subscription_duration_type: [
        "1_month",
        "3_months",
        "6_months",
        "1_year",
        "2_years",
      ],
      subscription_plan_type: ["basic", "standard", "premium"],
      subscription_status_type: ["trial", "active", "expired", "cancelled"],
    },
  },
} as const
