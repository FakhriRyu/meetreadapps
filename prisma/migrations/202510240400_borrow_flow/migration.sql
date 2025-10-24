-- AlterTable
ALTER TABLE "Book" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE "Book" ADD COLUMN "borrowerId" INTEGER;
ALTER TABLE "Book" ADD COLUMN "dueDate" DATETIME;

-- CreateTable
CREATE TABLE "BorrowRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bookId" INTEGER NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "whatsappUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX "BorrowRequest_bookId_idx" ON "BorrowRequest"("bookId");
CREATE INDEX "BorrowRequest_requesterId_idx" ON "BorrowRequest"("requesterId");
