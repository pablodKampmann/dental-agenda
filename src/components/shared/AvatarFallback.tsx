'use client'

import React, { useState } from 'react';
import Image from 'next/image';

interface AvatarFallbackProps {
    photoURL?: string | null;
    displayName?: string | null;
    reloadKey?: string | number;
    className?: string;
    size?: number;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(word => word[0].toUpperCase())
        .join('');
}

function hashColor(name: string): string {
    const colors = [
        '#0F6E56', // teal
        '#185FA5', // blue
        '#854F0B', // amber
        '#533AB7', // purple
        '#993556', // pink
        '#3B6D11', // green
        '#993C1D', // coral
        '#5F5E5A', // gray
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export function AvatarFallback({
    photoURL,
    displayName,
    reloadKey,
    className = 'rounded-full cursor-pointer object-cover hover:border-opacity-70 border-2 border-white border-opacity-5 transition duration-150 h-[40px] w-[40px] shadow-2xl select-none',
    size = 40,
}: AvatarFallbackProps) {
    const [imgError, setImgError] = useState(false);

    const showFallback = !photoURL || imgError;
    const initials = displayName ? getInitials(displayName) : '?';
    const bgColor = displayName ? hashColor(displayName) : '#0F6E56';

    if (showFallback) {
        return (
            <div
                className={className}
                style={{
                    width: size,
                    height: size,
                    backgroundColor: bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: size * 0.35,
                    fontWeight: 600,
                    color: 'white',
                    flexShrink: 0,
                }}
            >
                {initials}
            </div>
        );
    }

    return (
        <Image
            src={`${photoURL}${reloadKey ? `?${reloadKey}` : ''}`}
            quality={100}
            priority={true}
            width={size}
            height={size}
            className={className}
            alt={displayName || 'User'}
            onError={() => setImgError(true)}
            placeholder='blur'
            blurDataURL='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8XwMAAoABfYJLKisAAAAASUVORK5CYII='
        />
    );
}
