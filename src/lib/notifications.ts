// @ts-nocheck - Temporary: Needs migration to Supabase
import { getSupabaseServer } from "@/lib/supabase";

type NotificationType = 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXTENDED' | 'RETURNED';

export const createBorrowNotification = async (params: {
  requestId: number;
  type: NotificationType;
  message?: string | null;
}) => {
  const supabase = getSupabaseServer();
  await supabase.from('BorrowNotification').insert([{
    requestId: params.requestId,
    type: params.type,
    message: params.message ?? null,
  }]);
};
