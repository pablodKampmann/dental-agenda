'use client'

import { useMediaQuery } from "../../hooks/useMediaQuery";
import { DesktopVersion } from "./desktopVersion";
import { MobileVersion } from "./mobileVersion";
import { ConfirmAlert } from '../shared/dialogAlerts/confirmAlert';
import { logOut } from '@/services/auth/logOut';
import { useRouteTitle } from '@/hooks/useDocumentTitle';
import React, { useState } from 'react';

export function Navigation() {
    useRouteTitle();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [openLogOutAlert, setOpenLogOutAlert] = useState(false);
    return (
        <div>
            <ConfirmAlert
                open={openLogOutAlert}
                setOpen={setOpenLogOutAlert}
                title="¿Cerrar sesión?"
                description="Deberás volver a ingresar tus credenciales para acceder nuevamente."
                onConfirm={async () => { await logOut(); }}
                confirmText="Cerrar sesión"
            />
            {isMobile ? (
                <MobileVersion openLogOutAlert={openLogOutAlert} setOpenLogOutAlert={setOpenLogOutAlert} />
            ) : (
                <DesktopVersion openLogOutAlert={openLogOutAlert} setOpenLogOutAlert={setOpenLogOutAlert} />
            )}
        </div>
    );
}