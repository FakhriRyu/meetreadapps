import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeetRead",
  description:
    "Platform peminjaman buku dengan pengalaman pengguna yang modern.",
  icons: {
    icon: [
      {
        url: "/meetread-logo.jpeg",
        type: "image/jpeg",
        sizes: "500x500",
      },
    ],
    apple: [
      {
        url: "/meetread-logo.jpeg",
        type: "image/jpeg",
        sizes: "500x500",
      },
    ],
    shortcut: ["/meetread-logo.jpeg"],
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
