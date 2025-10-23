import { z } from "zod";

const currentYear = new Date().getFullYear();

export const BookFormSchema = z
  .object({
    title: z.string().trim().min(1, "Judul wajib diisi"),
    author: z.string().trim().min(1, "Penulis wajib diisi"),
    category: z
      .string()
      .trim()
      .transform((value) => (value === "" ? undefined : value))
      .optional(),
    isbn: z
      .string()
      .trim()
      .transform((value) => (value === "" ? undefined : value))
      .optional(),
    publishedYear: z
      .union([z.string(), z.number()])
      .transform((value) => {
        const parsed = typeof value === "string" ? parseInt(value, 10) : value;
        return Number.isNaN(parsed) ? undefined : parsed;
      })
      .optional(),
    totalCopies: z
      .union([z.string(), z.number()])
      .transform((value) => (typeof value === "string" ? parseInt(value, 10) : value))
      .pipe(z.number().int().min(0, "Jumlah eksemplar minimal 0")),
    availableCopies: z
      .union([z.string(), z.number()])
      .transform((value) => (typeof value === "string" ? parseInt(value, 10) : value))
      .pipe(z.number().int().min(0, "Eksemplar tersedia minimal 0")),
    coverImageUrl: z
      .string()
      .trim()
      .url("Gunakan URL sampul yang valid")
      .or(z.literal(""))
      .transform((value) => (value === "" ? undefined : value))
      .optional(),
    description: z
      .string()
      .trim()
      .transform((value) => (value === "" ? undefined : value))
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      typeof data.publishedYear === "number" &&
      (data.publishedYear < 1450 || data.publishedYear > currentYear + 1)
    ) {
      ctx.addIssue({
        path: ["publishedYear"],
        code: z.ZodIssueCode.custom,
        message: "Tahun terbit tidak valid",
      });
    }

    if (data.availableCopies > data.totalCopies) {
      ctx.addIssue({
        path: ["availableCopies"],
        code: z.ZodIssueCode.custom,
        message: "Eksemplar tersedia tidak boleh melebihi total eksemplar",
      });
    }
  });

export type BookFormData = z.infer<typeof BookFormSchema>;
