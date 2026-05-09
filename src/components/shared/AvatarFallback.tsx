'use client'

import React from 'react';

interface AvatarFallbackProps {
    displayName?: string | null;
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
        '#0F6E56',
        '#185FA5',
        '#854F0B',
        '#533AB7',
        '#993556',
        '#3B6D11',
        '#993C1D',
        '#5F5E5A',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export function AvatarFallback({
    displayName,
    className = 'rounded-full cursor-pointer hover:border-opacity-70 border-2 border-white border-opacity-5 transition duration-150 h-[40px] w-[40px] shadow-2xl select-none',
    size = 40,
}: AvatarFallbackProps) {
    const initials = displayName ? getInitials(displayName) : '?';
    const bgColor = displayName ? hashColor(displayName) : '#0F6E56';

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
