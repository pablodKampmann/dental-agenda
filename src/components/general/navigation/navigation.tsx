'use client'

import { useMediaQuery } from "./../../../hooks/useMediaQuery";
import { DesktopVersion } from "./desktopVersion";
import { MobileVersion } from "./mobileVersion";

export function Navigation() {
    const isDesktop = useMediaQuery('(min-width: 768px)');

    if (isDesktop) {
        return (
            <DesktopVersion />
        );
    } else {
        return (
            <MobileVersion />
        );
    }
}