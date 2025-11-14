# 🔄 Migration Guide: Prisma → Supabase Client

## ⚠️ IMPORTANT: Data Anda AMAN!

Migration ini **HANYA** mengganti cara mengakses database. Data di Supabase **TIDAK akan terhapus**!

---

## 📋 Setup Environment Variables

Buat file `.env.local` di root project dengan kredensial Supabase Anda:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database URLs (untuk migration bertahap)
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url

# Session Secret
AUTH_SECRET=your_session_secret
```

### Cara Mendapatkan Supabase Keys:

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Klik **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

---

## 🗺️ Migration Progress

### ✅ Completed:
- [x] Install Supabase client
- [x] Generate database types
- [x] Create Supabase client utility
- [x] Migrate session logic (new file: `session-supabase.ts`)

### 🔄 In Progress:
- [ ] Replace Prisma imports dengan Supabase
- [ ] Migrate pages queries
- [ ] Migrate API routes

### ⏳ Pending:
- [ ] Test all functionality
- [ ] Remove Prisma dependencies

---

## 📦 Files Structure

```
src/
├── lib/
│   ├── supabase.ts          # ✅ NEW: Supabase client setup
│   ├── session-supabase.ts  # ✅ NEW: Session dengan Supabase
│   ├── session.ts           # ⏳ OLD: Masih pakai Prisma
│   ├── prisma.ts            # ❌ Will be removed
│   └── auth.ts              # ✅ No changes needed
├── types/
│   └── database.types.ts    # ✅ NEW: Database types
└── app/
    └── (user)/
        ├── beranda/page.tsx  # ⏳ TODO: Migrate
        ├── pinjam/page.tsx   # ⏳ TODO: Migrate
        ├── koleksiku/page.tsx # ⏳ TODO: Migrate
        └── ...
```

---

## 🔄 Migration Pattern

### Before (Prisma):
```typescript
import { prisma } from "@/lib/prisma";

const books = await prisma.book.findMany({
  where: { ownerId: null },
  orderBy: { createdAt: "desc" },
  select: { id: true, title: true, author: true }
});
```

### After (Supabase):
```typescript
import { supabaseServer } from "@/lib/supabase";

const { data: books, error } = await supabaseServer
  .from('Book')
  .select('id, title, author')
  .is('ownerId', null)
  .order('createdAt', { ascending: false });
```

---

## 📖 Common Query Patterns

### 1. Find Many
```typescript
// Prisma
const books = await prisma.book.findMany({ where: { lendable: true } });

// Supabase
const { data: books } = await supabaseServer
  .from('Book')
  .select('*')
  .eq('lendable', true);
```

### 2. Find Unique
```typescript
// Prisma
const user = await prisma.user.findUnique({ where: { id: 1 } });

// Supabase
const { data: user } = await supabaseServer
  .from('User')
  .select('*')
  .eq('id', 1)
  .single();
```

### 3. Create
```typescript
// Prisma
const book = await prisma.book.create({
  data: { title: "Book", author: "Author", totalCopies: 1, availableCopies: 1 }
});

// Supabase
const { data: book } = await supabaseServer
  .from('Book')
  .insert({ title: "Book", author: "Author", totalCopies: 1, availableCopies: 1 })
  .select()
  .single();
```

### 4. Update
```typescript
// Prisma
await prisma.book.update({
  where: { id: 1 },
  data: { title: "New Title" }
});

// Supabase
await supabaseServer
  .from('Book')
  .update({ title: "New Title" })
  .eq('id', 1);
```

### 5. Delete
```typescript
// Prisma
await prisma.book.delete({ where: { id: 1 } });

// Supabase
await supabaseServer
  .from('Book')
  .delete()
  .eq('id', 1);
```

### 6. Joins (Relations)
```typescript
// Prisma
const requests = await prisma.borrowRequest.findMany({
  include: {
    book: { select: { id: true, title: true } },
    requester: { select: { name: true, email: true } }
  }
});

// Supabase
const { data: requests } = await supabaseServer
  .from('BorrowRequest')
  .select(`
    *,
    book:Book!BorrowRequest_bookId_fkey(id, title),
    requester:User!BorrowRequest_requesterId_fkey(name, email)
  `);
```

---

## 🚀 Next Steps

1. **Copy `.env.example` to `.env.local`**
2. **Fill in your Supabase credentials**
3. **Test dev server**: `npm run dev`
4. **I will migrate remaining files step by step**

---

## ⚠️ Important Notes

- ✅ **Data is SAFE** - Only changing how we access it
- ✅ **Auth logic unchanged** - Still using custom JWT auth
- ✅ **Gradual migration** - Can run both Prisma & Supabase temporarily
- ✅ **Rollback possible** - Keep Prisma files until migration complete

---

## 📞 Need Help?

If you encounter any issues during migration, we can:
1. Rollback specific changes
2. Run both systems in parallel
3. Debug specific queries

**Remember: Your database data is completely safe!** 🛡️

