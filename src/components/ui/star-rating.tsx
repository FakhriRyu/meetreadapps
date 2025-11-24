"use client";

import { useState } from "react";

type StarRatingProps = {
    rating: number;
    maxRating?: number;
    onRatingChange?: (rating: number) => void;
    readOnly?: boolean;
    size?: "sm" | "md" | "lg";
};

export function StarRating({
    rating,
    maxRating = 5,
    onRatingChange,
    readOnly = false,
    size = "md",
}: StarRatingProps) {
    const [hoverRating, setHoverRating] = useState<number | null>(null);

    const sizeClasses = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
    };

    const handleMouseEnter = (index: number) => {
        if (!readOnly) {
            setHoverRating(index);
        }
    };

    const handleMouseLeave = () => {
        if (!readOnly) {
            setHoverRating(null);
        }
    };

    const handleClick = (index: number) => {
        if (!readOnly && onRatingChange) {
            onRatingChange(index);
        }
    };

    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: maxRating }, (_, i) => {
                const index = i + 1;
                const isFilled = (hoverRating !== null ? hoverRating : rating) >= index;

                return (
                    <button
                        key={index}
                        type="button"
                        className={`${readOnly ? "cursor-default" : "cursor-pointer"} focus:outline-none`}
                        onMouseEnter={() => handleMouseEnter(index)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleClick(index)}
                        disabled={readOnly}
                    >
                        <svg
                            className={`${sizeClasses[size]} ${isFilled ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"
                                } transition-colors duration-150`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </button>
                );
            })}
        </div>
    );
}
