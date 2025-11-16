// Standalone enums mirroring the Supabase enum types

import type { Database } from './database.types'

export enum BookStatus {
  AVAILABLE = 'AVAILABLE',
  PENDING = 'PENDING',
  BORROWED = 'BORROWED',
  RESERVED = 'RESERVED',
  UNAVAILABLE = 'UNAVAILABLE',
}

export enum BorrowRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationType {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  EXTENDED = 'EXTENDED',
  RETURNED = 'RETURNED',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// Export database types for easy importing
export type Book = Database['public']['Tables']['Book']['Row']
export type User = Database['public']['Tables']['User']['Row']
export type BorrowRequest = Database['public']['Tables']['BorrowRequest']['Row']
export type BorrowNotification = Database['public']['Tables']['BorrowNotification']['Row']
