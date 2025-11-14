# 🔄 API Migration Status

## ✅ Completed (5/19)

### Auth APIs
- [x] `/api/auth/login` - Login user
- [x] `/api/auth/register` - Register new user
- [ ] `/api/auth/loginadmin` - Admin login
- [ ] `/api/auth/logout` - Logout
- [ ] `/api/auth/session` - Check session

### Pages (All Migrated!)
- [x] Beranda page
- [x] Pinjam page
- [x] Koleksiku page
- [x] Notifikasi page
- [x] Permintaan page
- [x] Profil page

## ⏳ In Progress

### Books APIs  
- [ ] `/api/books` - List/Create books
- [ ] `/api/books/[id]` - Get/Update/Delete book

### Borrow APIs
- [ ] `/api/borrow/request` - Create borrow request
- [ ] `/api/borrow/requests/me` - Get my requests
- [ ] `/api/borrow/requests/[id]/approve` - Approve request
- [ ] `/api/borrow/requests/[id]/reject` - Reject request
- [ ] `/api/borrow/requests/[id]/complete` - Complete/return book
- [ ] `/api/borrow/requests/[id]/extend` - Extend due date

### Collections APIs
- [ ] `/api/collections` - List/Create collection
- [ ] `/api/collections/[id]` - Update/Delete collection

### Profile APIs
- [ ] `/api/profile` - Get/Update profile
- [ ] `/api/profile/password` - Change password

### Admin APIs
- [ ] `/api/admin/users` - List users (admin)
- [ ] `/api/admin/users/[id]` - Update/Delete user (admin)

---

## 📝 Migration Pattern

### Before (Prisma):
```typescript
import { prisma } from "@/lib/prisma";

const user = await prisma.user.findUnique({
  where: { id: 1 }
});
```

### After (Supabase):
```typescript
import { supabaseServer } from "@/lib/supabase";

const { data: user } = await supabaseServer
  .from('User')
  .select('*')
  .eq('id', 1)
  .single();
```

---

## 🚦 Next Steps

1. Test yang sudah dimigrate (pages + auth)
2. Migrate critical APIs (books, borrow)
3. Migrate remaining APIs
4. Full testing
5. Remove Prisma

---

## ✅ What's Working Now

- ✅ All user pages (beranda, pinjam, koleksiku, etc)
- ✅ Login & Register
- ✅ Session management
- ⏳ Books CRUD (in progress)
- ⏳ Borrow flow (in progress)

