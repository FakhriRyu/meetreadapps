import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MeetRead",
    short_name: "MeetRead",
    description:
      "Platform peminjaman buku dengan pengalaman pengguna yang modern.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b66c2",
    theme_color: "#0b66c2",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
