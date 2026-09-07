export const SIDEBAR_CAROUSEL_REFRESH_EVENT = "sidebarCarousel:refresh";

/**
 * Avisa al carrusel del sidebar que un turno o un paciente nuevo se acaba
 * de crear, así se refresca sin necesidad de un listener realtime permanente.
 */
export function invalidateSidebarCarousel() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(SIDEBAR_CAROUSEL_REFRESH_EVENT));
}
