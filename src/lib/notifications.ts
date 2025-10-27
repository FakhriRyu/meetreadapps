import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export const createBorrowNotification = async (params: {
  requestId: number;
  type: NotificationType;
  message?: string | null;
}) => {
  await prisma.borrowNotification.create({
    data: {
      requestId: params.requestId,
      type: params.type,
      message: params.message ?? null,
    },
  });
};
