'use client'

import { useMediaQuery } from "./../../../hooks/useMediaQuery";
import { DesktopVersion } from "./desktopVersion";
import { MobileVersion } from "./mobileVersion";
import { LogOutAlert } from '../dialogAlerts/logOutAlert';
import React, { useState, useEffect } from 'react';

export function Navigation() {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [openLogOutAlert, setOpenLogOutAlert] = useState(false);
    const [showNavigation, setShowNavigation] = useState(false);

    useEffect(() => {
        if (isMobile !== undefined) {
            setShowNavigation(true);
        }
    }, [isMobile]);

    if (!showNavigation) return null;

    return (
        <div>
            {openLogOutAlert && (
                <LogOutAlert open={openLogOutAlert} setOpen={setOpenLogOutAlert} />
            )}
            {isMobile ? (
                <MobileVersion openLogOutAlert={openLogOutAlert} setOpenLogOutAlert={setOpenLogOutAlert} />
            ) : (
                <DesktopVersion openLogOutAlert={openLogOutAlert} setOpenLogOutAlert={setOpenLogOutAlert} />
            )}
        </div>
    );
}