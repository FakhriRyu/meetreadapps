"use client";

import { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
    fallbackSrc?: string;
    fallbackContent?: React.ReactNode;
}

export function SafeImage({
    src,
    alt,
    fallbackSrc = "/placeholder.png",
    fallbackContent,
    className,
    ...props
}: SafeImageProps) {
    const [error, setError] = useState(false);
    const [imgSrc, setImgSrc] = useState(src);

    useEffect(() => {
        setImgSrc(src);
        setError(false);
    }, [src]);

    if (error || !imgSrc) {
        if (fallbackContent) {
            return <>{fallbackContent}</>;
        }
        // If we have a fallbackSrc, rendering an Image with that source might also fail if not configured,
        // so for absolute safety we might restart to a simple div or just try the fallback once.
        // Here we'll try to render the fallback image, but if that's what we were trying, we show a basic placeholder div.
        if (imgSrc === fallbackSrc) {
            return (
                <div className={`flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 ${className}`}>
                    <span className="text-xs">No Image</span>
                </div>
            );
        }
    }

    return (
        <Image
            {...props}
            src={error ? fallbackSrc : imgSrc}
            alt={alt}
            className={className}
            onError={() => setError(true)}
        />
    );
}
