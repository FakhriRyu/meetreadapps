"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import type { Book } from "@/types/enums";
import { StarRating } from "@/components/ui/star-rating";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  joinedAt?: Date | string;
  profileImage?: string | null;
};

type HomeBook = Pick<
  Book,
  "id" | "title" | "author" | "category" | "coverImageUrl" | "publishedYear" | "totalCopies" | "availableCopies"
> & {
  averageRating?: number;
  reviewCount?: number;
};


type Banner = {
  id: number;
  title: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
  createdAt: string;
};

type HomeViewProps = {
  books: HomeBook[];
  sessionUser: SessionUser | null;
  banners: Banner[];
};

const DEFAULT_CATEGORY = "Semua";
const PROFILE_PLACEHOLDER_AVATAR = "https://api.dicebear.com/7.x/initials/png";

export function HomeView({ books, sessionUser, banners }: HomeViewProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(DEFAULT_CATEGORY);
  const [activeAuthor, setActiveAuthor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/notifications/count");
        const result = await response.json();
        if (response.ok) {
          setUnreadCount(result.count);
        }
      } catch (error) {
        console.error("Failed to fetch notification count", error);
      }
    };

    fetchUnreadCount();
  }, []);

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    books.forEach((book) => {
      const label = book.category?.trim();
      if (label && label.length > 0) {
        unique.add(label);
      } else {
        unique.add("Umum");
      }
    });
    return [DEFAULT_CATEGORY, ...Array.from(unique).sort((a, b) => a.localeCompare(b, "id-ID"))];
  }, [books]);

  const resolvedCategory = categories.includes(activeCategory) ? activeCategory : DEFAULT_CATEGORY;

  const baseFilteredBooks = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    return books.filter((book) => {
      const categoryLabel = book.category?.trim() ?? "Umum";
      const matchesCategory = resolvedCategory === DEFAULT_CATEGORY || categoryLabel === resolvedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        book.title.toLowerCase().includes(normalizedQuery) ||
        book.author.toLowerCase().includes(normalizedQuery) ||
        categoryLabel.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [books, resolvedCategory, search]);

  const authors = useMemo(() => {
    const unique = new Set<string>();
    baseFilteredBooks.forEach((book) => {
      if (book.author.trim().length > 0) {
        unique.add(book.author.trim());
      }
    });
    return Array.from(unique).slice(0, 12);
  }, [baseFilteredBooks]);

  const resolvedAuthor = activeAuthor && authors.includes(activeAuthor) ? activeAuthor : null;

  const filteredBooks = useMemo(() => {
    if (!resolvedAuthor) {
      return baseFilteredBooks;
    }
    const normalizedAuthor = resolvedAuthor.toLowerCase();
    return baseFilteredBooks.filter((book) => book.author.trim().toLowerCase() === normalizedAuthor);
  }, [baseFilteredBooks, resolvedAuthor]);

  const freshArrivals = useMemo(() => {
    const sorted = [...filteredBooks].sort((a, b) => {
      const countA = a.reviewCount ?? 0;
      const countB = b.reviewCount ?? 0;
      return countB - countA;
    });
    return sorted.slice(0, 6);
  }, [filteredBooks]);


  const categoryRecommendations = useMemo(() => {
    const categoryMap = new Map<string, HomeBook[]>();

    // Group books by category
    books.forEach((book) => {
      const category = book.category?.trim() || "Umum";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(book);
    });

    // Get top categories by book count, limit to 5 categories
    const topCategories = Array.from(categoryMap.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5)
      .map(([category, categoryBooks]) => {
        // Get up to 5 books from this category
        const recommendedBooks = categoryBooks.slice(0, 5);

        // Define captions for common categories
        const captions: Record<string, string> = {
          "Romance": "Kisah cinta yang menghangatkan hati",
          "Romantis": "Kisah cinta yang menghangatkan hati",
          "Fiction": "Dunia imajinasi tanpa batas",
          "Fiksi": "Dunia imajinasi tanpa batas",
          "Non-Fiction": "Pengetahuan dan wawasan baru",
          "Non-Fiksi": "Pengetahuan dan wawasan baru",
          "Mystery": "Misteri yang menantang pikiran",
          "Misteri": "Misteri yang menantang pikiran",
          "Fantasy": "Petualangan di dunia fantasi",
          "Fantasi": "Petualangan di dunia fantasi",
          "Thriller": "Ketegangan yang memacu adrenalin",
          "Horror": "Cerita yang menguji keberanian",
          "Horor": "Cerita yang menguji keberanian",
          "Biography": "Kisah inspiratif tokoh dunia",
          "Biografi": "Kisah inspiratif tokoh dunia",
          "Self-Help": "Panduan pengembangan diri",
          "Science": "Eksplorasi ilmu pengetahuan",
          "Sains": "Eksplorasi ilmu pengetahuan",
          "History": "Perjalanan masa lalu",
          "Sejarah": "Perjalanan masa lalu",
          "Poetry": "Keindahan kata dan makna",
          "Puisi": "Keindahan kata dan makna",
        };

        return {
          category,
          books: recommendedBooks,
          caption: captions[category] || `Koleksi ${category} pilihan`,
        };
      });

    return topCategories;
  }, [books]);

  const avatarInitials = useMemo(() => {
    const source = sessionUser?.name ?? sessionUser?.email ?? "MeetRead";
    return source
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  }, [sessionUser?.email, sessionUser?.name]);

  const avatarFallbackUrl = useMemo(() => {
    const seed = sessionUser?.name ?? sessionUser?.email ?? "MeetRead";
    return `${PROFILE_PLACEHOLDER_AVATAR}?seed=${encodeURIComponent(seed)}`;
  }, [sessionUser?.email, sessionUser?.name]);

  const profileImage = sessionUser?.profileImage?.trim() ?? null;
  const hasProfileImage = Boolean(profileImage);
  const firstName = sessionUser?.name?.split(" ")[0] ?? "Pembaca";

  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900 pb-24">
      <div className="mx-auto w-full max-w-6xl px-6 pt-10">
        <header className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Hai, {firstName}! 👋</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/notifikasi"
              prefetch={true}
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              aria-label="Notifikasi"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className="absolute right-3 top-3 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </Link>
            <Link
              href="/profil"
              prefetch={true}
              className="relative block h-11 w-11 overflow-hidden rounded-full border border-slate-200 bg-white transition hover:border-slate-300"
              aria-label="Profil"
            >
              {hasProfileImage ? (
                <Image src={profileImage!} alt={sessionUser?.name ?? "Profil"} fill sizes="44px" className="object-cover" />
              ) : (
                <Image src={avatarFallbackUrl} alt={sessionUser?.name ?? "Profil"} fill sizes="44px" className="object-cover" />
              )}
              {!hasProfileImage && (
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-700">
                  {avatarInitials}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Search Bar - Moved here */}
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-md">
          <MagnifierIcon className="h-5 w-5 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari judul, penulis, atau kategori..."
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Full Width Banner Section */}
      <section className="mt-8 w-full">
        {/* Banner Carousel - Removed rounded-3xl and px-6 padding context */}
        <div className="relative w-full overflow-hidden bg-slate-100 shadow-md">
          {banners.length > 0 ? (
            <>
              <div
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
              >
                {banners.map((banner) => (
                  <div key={banner.id} className="relative w-full flex-shrink-0">
                    <Image
                      src={banner.imageUrl}
                      alt={banner.title}
                      width={0}
                      height={0}
                      sizes="100vw"
                      style={{ width: '100%', height: 'auto' }}
                      priority
                    />
                  </div>
                ))}
              </div>

              {/* Dots Indicator */}
              {banners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBannerIndex(index)}
                      className={`h-2 w-2 rounded-full transition-all ${index === currentBannerIndex ? "w-6 bg-white" : "bg-white/50 hover:bg-white/80"
                        }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            // Placeholder Banner
            <div className="relative aspect-[2.5/1] w-full sm:aspect-[3/1] md:aspect-[4/1] bg-gradient-to-r from-indigo-500 to-purple-600">
              <div className="absolute inset-0 flex flex-col justify-center px-8 text-white">
                <span className="mb-2 inline-block w-fit rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                  Promo Spesial
                </span>
                <h2 className="text-2xl font-bold sm:text-3xl md:text-4xl">
                  Temukan Buku <br /> Favoritmu Disini
                </h2>
                <p className="mt-2 text-sm text-indigo-100 sm:text-base">
                  Jelajahi ribuan koleksi buku menarik untukmu.
                </p>
              </div>
              <div className="absolute bottom-0 right-0 h-full w-1/2 opacity-20">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
                  <path fill="#FFFFFF" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.9,32.2C59.6,42.9,48.3,51.4,36.4,58.3C24.5,65.2,12,70.5,-0.3,71C-12.6,71.5,-25.2,67.2,-36.4,60.1C-47.6,53,-57.4,43.1,-65.4,31.4C-73.4,19.7,-79.6,6.2,-78.3,-6.8C-77,-19.8,-68.2,-32.3,-58.1,-42.6C-48,-52.9,-36.6,-61,-24.5,-69.6C-12.4,-78.2,0.4,-87.3,13.2,-87.1C26,-86.9,30.5,-100.2,44.7,-76.4Z" transform="translate(100 100)" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-6xl flex-col px-6 space-y-6 mt-6">
        <section className="space-y-6">
          <div className="-mx-2 flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => {
              const isActive = category === resolvedCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`mx-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${isActive
                    ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                    }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10 space-y-10">
          <div className="space-y-4">
            <SectionHeading label="Koleksi Populer" />
            <div className="-mx-2 flex gap-5 overflow-x-auto pb-2">
              {freshArrivals.length === 0 ? (
                <div className="mx-2 w-full rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-100">
                  Belum ada buku dalam kategori ini. Coba kata kunci lain ya!
                </div>
              ) : (
                freshArrivals.map((book) => (
                  <Link
                    key={`arrival-${book.id}`}
                    href={`/books/${book.id}`}
                    prefetch={false}
                    className="group relative mx-2 w-40 flex-shrink-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
                  >
                    <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-slate-100">
                      {book.coverImageUrl ? (
                        <Image
                          src={book.coverImageUrl}
                          alt={book.title}
                          fill
                          sizes="160px"
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                          Tidak ada sampul
                        </div>
                      )}
                      {book.averageRating ? (
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-900 backdrop-blur-sm">
                          <svg className="h-3 w-3 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                          {book.averageRating.toFixed(1)}
                        </div>
                      ) : null}
                    </div>
                    <p className="mt-3 line-clamp-1 text-sm font-semibold text-slate-900">{book.title}</p>
                    <p className="line-clamp-1 text-xs text-slate-500">{book.category ?? "Umum"}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <SectionHeading label="Penulis Pilihan" />
            <div className="-mx-2 flex gap-3 overflow-x-auto pb-2">
              {authors.length === 0 ? (
                <div className="mx-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm shadow-slate-100">
                  Penulis belum tersedia untuk pilihan ini.
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveAuthor(null)}
                    aria-pressed={resolvedAuthor === null}
                    className={`mx-2 flex h-20 min-w-[7rem] items-center justify-center rounded-2xl px-4 text-center text-sm font-semibold transition ${resolvedAuthor === null
                      ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                      }`}
                  >
                    Semua Penulis
                  </button>
                  {authors.map((author) => {
                    const isActive = resolvedAuthor === author;
                    return (
                      <button
                        type="button"
                        key={`author-${author}`}
                        onClick={() => setActiveAuthor(isActive ? null : author)}
                        aria-pressed={isActive}
                        className={`mx-2 flex h-20 min-w-[7rem] items-center justify-center rounded-2xl px-4 text-center text-sm font-semibold transition ${isActive
                          ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                          }`}
                      >
                        {author}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>



          {categoryRecommendations.map((recommendation) => (
            <div key={`category-${recommendation.category}`} className="space-y-4">
              <SectionHeading label={`Rekomendasi ${recommendation.category}`} caption={recommendation.caption} />
              <div className="-mx-2 flex gap-5 overflow-x-auto pb-2">
                {recommendation.books.length === 0 ? (
                  <div className="mx-2 w-full rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-100">
                    Belum ada buku {recommendation.category.toLowerCase()} saat ini.
                  </div>
                ) : (
                  recommendation.books.map((book) => (
                    <Link
                      key={`${recommendation.category}-${book.id}`}
                      href={`/books/${book.id}`}
                      prefetch={false}
                      className="group relative mx-2 w-40 flex-shrink-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
                    >
                      <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-slate-100">
                        {book.coverImageUrl ? (
                          <Image
                            src={book.coverImageUrl}
                            alt={book.title}
                            fill
                            sizes="160px"
                            className="object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                            Tidak ada sampul
                          </div>
                        )}
                        {book.averageRating ? (
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-900 backdrop-blur-sm">
                            <svg className="h-3 w-3 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                            {book.averageRating.toFixed(1)}
                          </div>
                        ) : null}
                      </div>
                      <p className="mt-3 line-clamp-1 text-sm font-semibold text-slate-900">{book.title}</p>
                      <p className="line-clamp-1 text-xs text-slate-500">{book.category ?? "Umum"}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

function SectionHeading({ label, caption }: { label: string; caption?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <span className="relative inline-flex text-lg font-semibold text-slate-900">
          {label}
          <span className="absolute left-0 bottom-0 h-2 w-full translate-y-2 rounded-full bg-indigo-200/70" aria-hidden />
        </span>
        {caption ? <p className="mt-3 text-xs text-slate-500">{caption}</p> : null}
      </div>
      <span className="text-xs font-medium text-indigo-500">Lihat semua</span>
    </div>
  );
}

function MagnifierIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className ?? "h-5 w-5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-2.6-2.6" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M18 16v-5a6 6 0 0 0-12 0v5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16h14l-1.5 2.5a1 1 0 0 1-.86.5H7.36a1 1 0 0 1-.86-.5L5 16Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className ?? "h-4 w-4"} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
