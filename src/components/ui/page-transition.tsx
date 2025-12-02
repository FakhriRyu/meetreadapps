"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav-items";
import { ReactNode, useRef, useEffect } from "react";

const variants = {
    enter: (direction: number) => ({
        x: direction > 0 ? "100%" : "-100%",
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? "100%" : "-100%",
        opacity: 0,
    }),
};

export function PageTransition({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    // Find index of current path. Default to 0 if not found (e.g. subpages)
    // or handle subpages differently. For now, we assume top-level nav.
    let index = NAV_ITEMS.findIndex((item) => item.href === pathname);

    // If path is not in NAV_ITEMS (e.g. detail page), try to match prefix or default to current index
    if (index === -1) {
        // If we are on a detail page, we might want to treat it as the parent tab's index
        // But for now, let's just keep the previous index to avoid wild jumps, 
        // or maybe don't animate slide, just fade.
        // Let's try to map sub-routes to tabs if possible, or just ignore.
        // For this task, "Beranda ke Pinjam" is the key.
        // If index is -1, we can default to 0 or keep previous.
        // Let's use a ref to store the "last valid index" to fallback?
        // Or just set index to -1 and handle it.
    }

    const prevIndex = useRef(index);

    // Calculate direction
    // If either is -1, we can default to 0 (fade) or just assume forward/backward based on some logic.
    // Let's assume if index is -1, we treat it as "no slide" or just direction 0.
    let direction = 0;
    if (index !== -1 && prevIndex.current !== -1 && index !== prevIndex.current) {
        direction = index > prevIndex.current ? 1 : -1;
    }

    useEffect(() => {
        if (index !== -1) {
            prevIndex.current = index;
        }
    }, [index]);

    return (
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.div
                key={pathname}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                }}
                className="w-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
