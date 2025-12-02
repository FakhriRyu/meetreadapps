"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[90vh] flex-col rounded-t-[2rem] bg-white shadow-2xl"
                    >
                        <div className="flex items-center justify-center pt-3 pb-2" onClick={onClose}>
                            <div className="h-1.5 w-12 rounded-full bg-slate-200" />
                        </div>

                        {title && (
                            <div className="border-b border-slate-100 px-6 pb-4 pt-2">
                                <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto px-6 pb-8 pt-4">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
}
