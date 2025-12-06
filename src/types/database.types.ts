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
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      AppSuggestion: {
        Row: {
          createdAt: string
          id: number
          suggestion: string
          userId: number
        }
        Insert: {
          createdAt?: string
          id?: number
          suggestion: string
          userId: number
        }
        Update: {
          createdAt?: string
          id?: number
          suggestion?: string
          userId?: number
        }
        Relationships: [
          {
            foreignKeyName: "AppSuggestion_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Banner: {
        Row: {
          createdAt: string
          id: number
          imageUrl: string
          isActive: boolean
          order: number
          title: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          id?: number
          imageUrl: string
          isActive?: boolean
          order?: number
          title: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          id?: number
          imageUrl?: string
          isActive?: boolean
          order?: number
          title?: string
          updatedAt?: string
        }
        Relationships: []
      }
      Book: {
        Row: {
          author: string
          availableCopies: number
          category: string | null
          coverImageUrl: string | null
          createdAt: string
          description: string | null
          id: number
          isbn: string | null
          ownerId: number
          publishedYear: number
          title: string
          totalCopies: number
          updatedAt: string
          warehouseLocation: string | null
          lendable: boolean
        }
        Insert: {
          author: string
          availableCopies?: number
          category?: string | null
          coverImageUrl?: string | null
          createdAt?: string
          description?: string | null
          id?: number
          isbn?: string | null
          ownerId: number
          publishedYear: number
          title: string
          totalCopies?: number
          updatedAt?: string
          warehouseLocation?: string | null
          lendable?: boolean
        }
        Update: {
          author?: string
          availableCopies?: number
          category?: string | null
          coverImageUrl?: string | null
          createdAt?: string
          description?: string | null
          id?: number
          isbn?: string | null
          ownerId?: number
          publishedYear?: number
          title?: string
          totalCopies?: number
          updatedAt?: string
          warehouseLocation?: string | null
          lendable?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "Book_ownerId_fkey"
            columns: ["ownerId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      BorrowRequest: {
        Row: {
          bookId: number
          createdAt: string
          endDate: string
          id: number
          message: string | null
          requesterId: number
          startDate: string
          status: Database["public"]["Enums"]["BorrowRequestStatus"]
          updatedAt: string
        }
        Insert: {
          bookId: number
          createdAt?: string
          endDate: string
          id?: number
          message?: string | null
          requesterId: number
          startDate: string
          status?: Database["public"]["Enums"]["BorrowRequestStatus"]
          updatedAt?: string
        }
        Update: {
          bookId?: number
          createdAt?: string
          endDate?: string
          id?: number
          message?: string | null
          requesterId?: number
          startDate?: string
          status?: Database["public"]["Enums"]["BorrowRequestStatus"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "BorrowRequest_bookId_fkey"
            columns: ["bookId"]
            isOneToOne: false
            referencedRelation: "Book"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "BorrowRequest_requesterId_fkey"
            columns: ["requesterId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Notification: {
        Row: {
          createdAt: string
          id: number
          isRead: boolean
          message: string
          requestId: number | null
          type: Database["public"]["Enums"]["NotificationType"]
          userId: number
        }
        Insert: {
          createdAt?: string
          id?: number
          isRead?: boolean
          message: string
          requestId?: number | null
          type: Database["public"]["Enums"]["NotificationType"]
          userId: number
        }
        Update: {
          createdAt?: string
          id?: number
          isRead?: boolean
          message?: string
          requestId?: number | null
          type?: Database["public"]["Enums"]["NotificationType"]
          userId?: number
        }
        Relationships: [
          {
            foreignKeyName: "Notification_requestId_fkey"
            columns: ["requestId"]
            isOneToOne: false
            referencedRelation: "BorrowRequest"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Notification_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      Review: {
        Row: {
          id: number
          bookId: number
          userId: number
          rating: number
          comment: string
          createdAt: string
        }
        Insert: {
          id?: number
          bookId: number
          userId: number
          rating: number
          comment: string
          createdAt?: string
        }
        Update: {
          id?: number
          bookId?: number
          userId?: number
          rating?: number
          comment?: string
          createdAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "Review_bookId_fkey"
            columns: ["bookId"]
            isOneToOne: false
            referencedRelation: "Book"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Review_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      SilentReadingEvent: {
        Row: {
          createdAt: string
          description: string | null
          id: number
          isActive: boolean
          startDate: string
          title: string
          coverImageUrl: string | null
        }
        Insert: {
          createdAt?: string
          description?: string | null
          id?: number
          isActive?: boolean
          startDate: string
          title: string
          coverImageUrl?: string | null
        }
        Update: {
          createdAt?: string
          description?: string | null
          id?: number
          isActive?: boolean
          startDate?: string
          title?: string
          coverImageUrl?: string | null
        }
        Relationships: []
      }
      SilentReadingParticipant: {
        Row: {
          created_at: string
          event_id: number
          id: number
          user_id: number
        }
        Insert: {
          created_at?: string
          event_id: number
          id?: number
          user_id: number
        }
        Update: {
          created_at?: string
          event_id?: number
          id?: number
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "SilentReadingParticipant_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "SilentReadingEvent"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SilentReadingParticipant_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      SilentReadingReview: {
        Row: {
          bookId: number | null
          createdAt: string
          entryType: string
          eventId: number
          id: number
          manualData: Json | null
          reviewText: string
          status: string
          userId: number
        }
        Insert: {
          bookId?: number | null
          createdAt?: string
          entryType: string
          eventId: number
          id?: number
          manualData?: Json | null
          reviewText: string
          status: string
          userId: number
        }
        Update: {
          bookId?: number | null
          createdAt?: string
          entryType?: string
          eventId?: number
          id?: number
          manualData?: Json | null
          reviewText?: string
          status?: string
          userId?: number
        }
        Relationships: [
          {
            foreignKeyName: "SilentReadingReview_bookId_fkey"
            columns: ["bookId"]
            isOneToOne: false
            referencedRelation: "Book"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SilentReadingReview_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "SilentReadingEvent"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SilentReadingReview_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          address: string | null
          createdAt: string
          email: string
          id: number
          name: string | null
          phoneNumber: string | null
          profileImage: string | null
          role: Database["public"]["Enums"]["UserRole"]
          updatedAt: string
          whatsappNumber: string | null
        }
        Insert: {
          address?: string | null
          createdAt?: string
          email: string
          id?: number
          name?: string | null
          phoneNumber?: string | null
          profileImage?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          updatedAt?: string
          whatsappNumber?: string | null
        }
        Update: {
          address?: string | null
          createdAt?: string
          email?: string
          id?: number
          name?: string | null
          phoneNumber?: string | null
          profileImage?: string | null
          role?: Database["public"]["Enums"]["UserRole"]
          updatedAt?: string
          whatsappNumber?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      BookStatus: "AVAILABLE" | "PENDING" | "RESERVED" | "BORROWED" | "UNAVAILABLE"
      BorrowRequestStatus: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "RETURNED"
      NotificationType: "APPROVED" | "REJECTED" | "CANCELLED" | "EXTENDED" | "RETURNED"
      UserRole: "USER" | "ADMIN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
    PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
    PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof PublicSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      BookStatus: [
        "AVAILABLE",
        "PENDING",
        "RESERVED",
        "BORROWED",
        "UNAVAILABLE",
      ],
      BorrowRequestStatus: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "CANCELLED",
        "RETURNED",
      ],
      NotificationType: [
        "APPROVED",
        "REJECTED",
        "CANCELLED",
        "EXTENDED",
        "RETURNED",
      ],
      UserRole: ["USER", "ADMIN"],
    },
  },
} as const
