import { FaCircleCheck } from "react-icons/fa6";
import { RiAlertFill, RiErrorWarningLine } from "react-icons/ri";
import { BsClipboardCheck } from "react-icons/bs";
import { TiDocumentDelete } from "react-icons/ti";
import { IoLogoUsd } from "react-icons/io5";
import { MdPersonAdd } from "react-icons/md";

export type ToastVariant =
    | "good"
    | "error"
    | "good-delete-appointment"
    | "good-patient"
    | "good-practice"
    | "good-delete-practice"
    | "good-prices-update"
    | "good-price-update"
    | "no-practices"
    | "saved";

const TOAST_CONFIG: Record<ToastVariant, { icon: React.ReactNode; message: string; color: string }> = {
    "good":                 { icon: <FaCircleCheck size={22} />,     message: "Turno creado correctamente",        color: "bg-emerald-400" },
    "error":                { icon: <RiErrorWarningLine size={22} />, message: "Error al crear el turno",           color: "bg-red-500" },
    "good-delete-appointment": { icon: <TiDocumentDelete size={24} />, message: "Turno eliminado correctamente",   color: "bg-emerald-400" },
    "good-patient":         { icon: <MdPersonAdd size={22} />,       message: "Paciente creado correctamente",     color: "bg-emerald-400" },
    "good-practice":        { icon: <BsClipboardCheck size={22} />,  message: "Práctica agregada exitosamente",    color: "bg-emerald-400" },
    "good-delete-practice": { icon: <TiDocumentDelete size={24} />,  message: "La práctica fue eliminada",         color: "bg-emerald-400" },
    "good-prices-update":   { icon: <IoLogoUsd size={22} />,         message: "Los precios han sido actualizados", color: "bg-emerald-400" },
    "good-price-update":    { icon: <IoLogoUsd size={22} />,         message: "El precio fue actualizado",         color: "bg-emerald-400" },
    "no-practices":         { icon: <RiAlertFill size={22} />,       message: "No tenés prácticas cargadas",       color: "bg-red-500" },
    "saved":                { icon: <FaCircleCheck size={22} />,     message: "Cambio guardado correctamente",     color: "bg-emerald-400" },
};

interface ToastProps {
    variant: ToastVariant | null;
}

export function Toast({ variant }: ToastProps) {
    if (!variant) return null;
    const config = TOAST_CONFIG[variant];
    if (!config) return null;

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-black shadow-xl text-black font-semibold text-base animate-messagge-from-right ${config.color}`}>
            {config.icon}
            <p className="select-none">{config.message}</p>
        </div>
    );
}