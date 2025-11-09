-- Adjust BorrowRequest.bookId foreign key to cascade when a Book is deleted
ALTER TABLE "BorrowRequest" DROP CONSTRAINT IF EXISTS "BorrowRequest_bookId_fkey";

ALTER TABLE "BorrowRequest"
  ADD CONSTRAINT "BorrowRequest_bookId_fkey"
  FOREIGN KEY ("bookId") REFERENCES "Book"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
