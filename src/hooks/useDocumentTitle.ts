import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STATIC_TITLES: Record<string, string> = {
  "/agenda": "Agenda",
  "/patients": "Pacientes",
  "/treatments": "Tratamientos",
  "/payments": "Pagos",
  "/config": "Configuración",
  "/estadisticas": "Estadísticas",
  "/messenger": "Mensajería",
  "/notSign": "Iniciar sesión",
};

/**
 * Vive en `Navigation` (montado una sola vez en el layout raíz, nunca cacheado/congelado
 * por el Router Cache del App Router) para asegurar que el título se reasigne en cada
 * cambio de ruta real — un `useEffect` puesto en cada page.tsx podía quedar "pegado" si
 * Next reusaba esa instancia de página desde el cache en vez de remontarla.
 */
export function useRouteTitle() {
  const pathname = usePathname();

  useEffect(() => {
    const title = STATIC_TITLES[pathname];
    if (title) document.title = `${title} — Dental Agenda`;
  }, [pathname]);
}

/** Para títulos dinámicos (nombre de paciente) que dependen de datos cargados en la propia página. */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = `${title} — Dental Agenda`;
  }, [title]);
}
