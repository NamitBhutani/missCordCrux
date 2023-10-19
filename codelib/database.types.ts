export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          about: string | null
          email: string
          id: string
          raw_user_meta_data: Json
        }
        Insert: {
          about?: string | null
          email: string
          id: string
          raw_user_meta_data: Json
        }
        Update: {
          about?: string | null
          email?: string
          id?: string
          raw_user_meta_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
