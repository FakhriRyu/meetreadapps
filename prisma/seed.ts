import { createClient } from "@supabase/supabase-js";

import { hashPassword } from "../src/lib/auth";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Supabase environment variables are missing.");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function main() {
  const adminEmail = "admin@meetread.com";
  const adminPasswordHash = await hashPassword("admin");

  const { error: upsertAdminError } = await supabase
    .from("User")
    .upsert(
      [
        {
          name: "Administrator",
          email: adminEmail,
          passwordHash: adminPasswordHash,
          role: "ADMIN",
          phoneNumber: "+62 812 0000 1111",
          profileImage: "https://i.pravatar.cc/300?u=meetread-admin",
        },
      ],
      { onConflict: "email" },
    );

  if (upsertAdminError) {
    throw upsertAdminError;
  }

  const books = [
    {
      title: "The Pragmatic Programmer",
      author: "Andrew Hunt",
      category: "Software Engineering",
      isbn: "9780201616224",
      publishedYear: 1999,
      totalCopies: 5,
      availableCopies: 3,
      coverImageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f",
      description: "Panduan klasik dalam membangun perangkat lunak yang tangguh dan berkelanjutan.",
    },
    {
      title: "Atomic Habits",
      author: "James Clear",
      category: "Self Improvement",
      isbn: "9780735211292",
      publishedYear: 2018,
      totalCopies: 8,
      availableCopies: 5,
      coverImageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794",
      description: "Strategi praktis membangun kebiasaan baik dan menghapus kebiasaan buruk.",
    },
    {
      title: "Educated",
      author: "Tara Westover",
      category: "Memoir",
      isbn: "9780399590504",
      publishedYear: 2018,
      totalCopies: 4,
      availableCopies: 2,
      coverImageUrl: "https://images.unsplash.com/photo-1528207776546-365bb710ee93",
      description: "Perjalanan seorang perempuan keluar dari keluarga survivalis untuk mengejar pendidikan.",
    },
    {
      title: "Deep Work",
      author: "Cal Newport",
      category: "Productivity",
      isbn: "9781455586691",
      publishedYear: 2016,
      totalCopies: 6,
      availableCopies: 4,
      coverImageUrl: "https://images.unsplash.com/photo-1522202222021-2375dc2fc343",
      description: "Prinsip fokus mendalam untuk mencapai produktivitas maksimal di tengah distraksi.",
    },
  ];

  await supabase.from("Book").delete().neq("id", 0);
  const { error: insertBooksError } = await supabase.from("Book").insert(books);
  if (insertBooksError) {
    throw insertBooksError;
  }
}

main()
  .then(() => {
    console.log("Seed selesai.");
  })
  .catch((error) => {
    console.error("Seed gagal dijalankan:", error);
    process.exit(1);
  });
