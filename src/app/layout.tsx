import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeetRead",
  description:
    "Platform peminjaman buku dengan panel admin dan pengalaman pengguna yang modern.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-white antialiased">{children}</body>
    </html>
  );
}
