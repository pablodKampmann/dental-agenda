'use client'

import { useMediaQuery } from "../../hooks/useMediaQuery";
import { DesktopVersion } from "./desktopVersion";
import { MobileVersion } from "./mobileVersion";
import { LogOutAlert } from '../shared/dialogAlerts/logOutAlert';
import React, { useState } from 'react';

export function Navigation() {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [openLogOutAlert, setOpenLogOutAlert] = useState(false);
    return (
        <div>
            <LogOutAlert open={openLogOutAlert} setOpen={setOpenLogOutAlert} />
            {isMobile ? (
                <MobileVersion openLogOutAlert={openLogOutAlert} setOpenLogOutAlert={setOpenLogOutAlert} />
            ) : (
                <DesktopVersion openLogOutAlert={openLogOutAlert} setOpenLogOutAlert={setOpenLogOutAlert} />
            )}
        </div>
    );
}