import React from 'react';

interface Props {
    direction: 'left' | 'right';
    className?: string;
    children: React.ReactNode;
}

export function PageSlide({ direction, className = '', children }: Props) {
    return (
        <div className={`${direction === 'left' ? 'animate-page-enter-left' : 'animate-page-enter-right'} ${className}`}>
            {children}
        </div>
    );
}
