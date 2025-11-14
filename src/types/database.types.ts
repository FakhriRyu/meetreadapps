// Database types generated from Prisma schema
// This will match your existing Supabase database structure

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      Book: {
        Row: {
          id: number
          title: string
          author: string
          category: string | null
          isbn: string | null
          publishedYear: number | null
          totalCopies: number
          availableCopies: number
          coverImageUrl: string | null
          description: string | null
          lendable: boolean
          source: string
          ownerId: number | null
          status: 'AVAILABLE' | 'PENDING' | 'RESERVED' | 'BORROWED' | 'UNAVAILABLE'
          borrowerId: number | null
          dueDate: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          title: string
          author: string
          category?: string | null
          isbn?: string | null
          publishedYear?: number | null
          totalCopies: number
          availableCopies: number
          coverImageUrl?: string | null
          description?: string | null
          lendable?: boolean
          source?: string
          ownerId?: number | null
          status?: 'AVAILABLE' | 'PENDING' | 'RESERVED' | 'BORROWED' | 'UNAVAILABLE'
          borrowerId?: number | null
          dueDate?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          title?: string
          author?: string
          category?: string | null
          isbn?: string | null
          publishedYear?: number | null
          totalCopies?: number
          availableCopies?: number
          coverImageUrl?: string | null
          description?: string | null
          lendable?: boolean
          source?: string
          ownerId?: number | null
          status?: 'AVAILABLE' | 'PENDING' | 'RESERVED' | 'BORROWED' | 'UNAVAILABLE'
          borrowerId?: number | null
          dueDate?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      User: {
        Row: {
          id: number
          name: string
          email: string
          passwordHash: string
          phoneNumber: string | null
          profileImage: string | null
          role: 'USER' | 'ADMIN'
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          name: string
          email: string
          passwordHash: string
          phoneNumber?: string | null
          profileImage?: string | null
          role?: 'USER' | 'ADMIN'
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          name?: string
          email?: string
          passwordHash?: string
          phoneNumber?: string | null
          profileImage?: string | null
          role?: 'USER' | 'ADMIN'
          createdAt?: string
          updatedAt?: string
        }
      }
      BorrowRequest: {
        Row: {
          id: number
          bookId: number
          requesterId: number
          status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'RETURNED'
          message: string | null
          whatsappUrl: string | null
          ownerMessage: string | null
          ownerDecisionAt: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: number
          bookId: number
          requesterId: number
          status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'RETURNED'
          message?: string | null
          whatsappUrl?: string | null
          ownerMessage?: string | null
          ownerDecisionAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: number
          bookId?: number
          requesterId?: number
          status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'RETURNED'
          message?: string | null
          whatsappUrl?: string | null
          ownerMessage?: string | null
          ownerDecisionAt?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
      BorrowNotification: {
        Row: {
          id: number
          requestId: number
          type: 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXTENDED' | 'RETURNED'
          message: string | null
          createdAt: string
        }
        Insert: {
          id?: number
          requestId: number
          type: 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXTENDED' | 'RETURNED'
          message?: string | null
          createdAt?: string
        }
        Update: {
          id?: number
          requestId?: number
          type?: 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXTENDED' | 'RETURNED'
          message?: string | null
          createdAt?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      UserRole: 'USER' | 'ADMIN'
      BookStatus: 'AVAILABLE' | 'PENDING' | 'RESERVED' | 'BORROWED' | 'UNAVAILABLE'
      BorrowRequestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'RETURNED'
      NotificationType: 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXTENDED' | 'RETURNED'
    }
  }
}

