import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#f5f7ff",
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
