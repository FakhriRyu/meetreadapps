import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeetRead",
  description:
    "Platform peminjaman buku dengan pengalaman pengguna yang modern.",
  icons: {
    icon: [
      {
        url: "/favicon.svg",
        type: "image/svg+xml",
        sizes: "any",
      },
    ],
    apple: [
      {
        url: "/favicon.svg",
      },
    ],
    shortcut: ["/favicon.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="text-slate-900 antialiased">{children}</body>
    </html>
  );
}
