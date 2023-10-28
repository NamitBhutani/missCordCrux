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
      chats: {
        Row: {
          channel: string
          chat: Json
          pkey: string
          timestamp: string
        }
        Insert: {
          channel: string
          chat: Json
          pkey?: string
          timestamp?: string
        }
        Update: {
          channel?: string
          chat?: Json
          pkey?: string
          timestamp?: string
        }
        Relationships: []
      }
      dm_members: {
        Row: {
          id: string | null
          member: string
          name: string | null
          pkey: string
        }
        Insert: {
          id?: string | null
          member: string
          name?: string | null
          pkey?: string
        }
        Update: {
          id?: string | null
          member?: string
          name?: string | null
          pkey?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_members_id_fkey"
            columns: ["id"]
            referencedRelation: "dms"
            referencedColumns: ["id"]
          }
        ]
      }
      dms: {
        Row: {
          admin: string
          id: string
        }
        Insert: {
          admin: string
          id: string
        }
        Update: {
          admin?: string
          id?: string
        }
        Relationships: []
      }
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
