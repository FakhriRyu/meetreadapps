-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Book" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "category" TEXT,
    "isbn" TEXT,
    "publishedYear" INTEGER,
    "totalCopies" INTEGER NOT NULL,
    "availableCopies" INTEGER NOT NULL,
    "coverImageUrl" TEXT,
    "description" TEXT,
    "lendable" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'library',
    "ownerId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "borrowerId" INTEGER,
    "dueDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Book_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Book_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Book" ("author", "availableCopies", "borrowerId", "category", "coverImageUrl", "createdAt", "description", "dueDate", "id", "isbn", "lendable", "ownerId", "publishedYear", "source", "status", "title", "totalCopies", "updatedAt") SELECT "author", "availableCopies", "borrowerId", "category", "coverImageUrl", "createdAt", "description", "dueDate", "id", "isbn", "lendable", "ownerId", "publishedYear", "source", "status", "title", "totalCopies", "updatedAt" FROM "Book";
DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";
CREATE UNIQUE INDEX "Book_isbn_key" ON "Book"("isbn");
CREATE TABLE "new_BorrowRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "bookId" INTEGER NOT NULL,
    "requesterId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "whatsappUrl" TEXT,
    "ownerMessage" TEXT,
    "ownerDecisionAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BorrowRequest_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BorrowRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BorrowRequest" ("bookId", "createdAt", "id", "message", "ownerDecisionAt", "ownerMessage", "requesterId", "status", "updatedAt", "whatsappUrl") SELECT "bookId", "createdAt", "id", "message", "ownerDecisionAt", "ownerMessage", "requesterId", "status", "updatedAt", "whatsappUrl" FROM "BorrowRequest";
DROP TABLE "BorrowRequest";
ALTER TABLE "new_BorrowRequest" RENAME TO "BorrowRequest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
