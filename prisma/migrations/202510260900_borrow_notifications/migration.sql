-- CreateTable
CREATE TABLE "BorrowNotification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "requestId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BorrowNotification_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BorrowRequest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
