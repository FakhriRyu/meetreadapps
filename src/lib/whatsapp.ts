"use client";

const isStandaloneDisplay = () => {
  if (typeof window === "undefined") return false;
  const standaloneMedia = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone ?? false;
  return standaloneMedia || iosStandalone;
};

export const openWhatsApp = (url: string) => {
  if (!url) return;
  if (isStandaloneDisplay()) {
    window.location.assign(url);
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
};
