-- DropForeignKey
ALTER TABLE "public"."BorrowRequest" DROP CONSTRAINT "BorrowRequest_bookId_fkey";

-- CreateIndex
CREATE INDEX "Book_ownerId_createdAt_idx" ON "Book"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "BorrowNotification_requestId_createdAt_idx" ON "BorrowNotification"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "BorrowRequest_requesterId_createdAt_idx" ON "BorrowRequest"("requesterId", "createdAt");

-- CreateIndex
CREATE INDEX "BorrowRequest_bookId_status_idx" ON "BorrowRequest"("bookId", "status");

-- AddForeignKey
ALTER TABLE "BorrowRequest" ADD CONSTRAINT "BorrowRequest_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

