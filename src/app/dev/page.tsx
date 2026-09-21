'use client'
import { useState } from "react";
import { runSeedPatients, SEED_PATIENTS, SEED_PATIENTS_EXTRA, SEED_PATIENT_PEDIATRICO } from "../../dev/seedPatients";
import { runMigrateAddTimestamps } from "../../dev/migrateAddTimestamps";
import { runSeedOdontograma, runSeedOdontogramaPediatrico } from "../../dev/seedOdontograma";
import { runClearAllPatients, type ClearPatientsResult } from "../../dev/clearPatients";
import { runClearAllTreatments } from "../../dev/clearTreatments";

export default function DevPage() {
    const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
    const [result, setResult] = useState<{ ok: number; failed: string[] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [statusExtra, setStatusExtra] = useState<"idle" | "running" | "done">("idle");
    const [resultExtra, setResultExtra] = useState<{ ok: number; failed: string[] } | null>(null);
    const [errorExtra, setErrorExtra] = useState<string | null>(null);
    const [migrateStatus, setMigrateStatus] = useState<"idle" | "running" | "done">("idle");
    const [migrateResult, setMigrateResult] = useState<{ updated: number; skipped: number; failed: string[] } | null>(null);
    const [migrateError, setMigrateError] = useState<string | null>(null);
    const [odontoStatus, setOdontoStatus] = useState<"idle" | "running" | "done">("idle");
    const [odontoResult, setOdontoResult] = useState<{ ok: boolean; pacienteId?: string; mensaje: string; fallidos: string[] } | null>(null);
    const [odontoError, setOdontoError] = useState<string | null>(null);
    const [odontoPedStatus, setOdontoPedStatus] = useState<"idle" | "running" | "done">("idle");
    const [odontoPedResult, setOdontoPedResult] = useState<{ ok: boolean; pacienteId?: string; mensaje: string; fallidos: string[] } | null>(null);
    const [odontoPedError, setOdontoPedError] = useState<string | null>(null);
    const [clearConfirmText, setClearConfirmText] = useState("");
    const [clearStatus, setClearStatus] = useState<"idle" | "running" | "done">("idle");
    const [clearResult, setClearResult] = useState<ClearPatientsResult | null>(null);
    const [clearError, setClearError] = useState<string | null>(null);
    const [clearTreatConfirmText, setClearTreatConfirmText] = useState("");
    const [clearTreatStatus, setClearTreatStatus] = useState<"idle" | "running" | "done">("idle");
    const [clearTreatResult, setClearTreatResult] = useState<number | null>(null);
    const [clearTreatError, setClearTreatError] = useState<string | null>(null);

    async function handleMigrate() {
        if (!window.confirm("¿Ejecutar la migración de timestamps sobre los pacientes de esta clínica?")) return;
        setMigrateStatus("running");
        setMigrateResult(null);
        setMigrateError(null);
        try {
            const res = await runMigrateAddTimestamps();
            setMigrateResult(res);
        } catch (e: any) {
            setMigrateError(e.message ?? "Error desconocido");
        }
        setMigrateStatus("done");
    }

    async function handleSeedOdontograma() {
        if (!window.confirm(`¿Cargar el odontograma de ejemplo sobre ${SEED_PATIENTS[0]?.name} ${SEED_PATIENTS[0]?.lastName}?`)) return;
        setOdontoStatus("running");
        setOdontoResult(null);
        setOdontoError(null);
        try {
            const res = await runSeedOdontograma();
            setOdontoResult(res);
        } catch (e: any) {
            setOdontoError(e.message ?? "Error desconocido");
        }
        setOdontoStatus("done");
    }

    async function handleSeedOdontogramaPediatrico() {
        if (!window.confirm(`¿Cargar el odontograma pediátrico sobre ${SEED_PATIENT_PEDIATRICO.name} ${SEED_PATIENT_PEDIATRICO.lastName}?`)) return;
        setOdontoPedStatus("running");
        setOdontoPedResult(null);
        setOdontoPedError(null);
        try {
            const res = await runSeedOdontogramaPediatrico();
            setOdontoPedResult(res);
        } catch (e: any) {
            setOdontoPedError(e.message ?? "Error desconocido");
        }
        setOdontoPedStatus("done");
    }

    async function handleSeedExtra() {
        if (!window.confirm(`¿Insertar ${SEED_PATIENTS_EXTRA.length} pacientes adicionales en Firebase?`)) return;
        setStatusExtra("running");
        setResultExtra(null);
        setErrorExtra(null);
        try {
            const res = await runSeedPatients(SEED_PATIENTS_EXTRA);
            setResultExtra(res);
        } catch (e: any) {
            setErrorExtra(e.message ?? "Error desconocido");
        }
        setStatusExtra("done");
    }

    async function handleSeed() {
        if (!window.confirm(`¿Insertar ${SEED_PATIENTS.length} pacientes en Firebase?`)) return;
        setStatus("running");
        setResult(null);
        setError(null);
        try {
            const res = await runSeedPatients();
            setResult(res);
        } catch (e: any) {
            setError(e.message ?? "Error desconocido");
        }
        setStatus("done");
    }

    async function handleClearAllPatients() {
        if (!window.confirm("Esto borra TODOS los pacientes de esta clínica junto con sus turnos y odontogramas. Es irreversible. ¿Confirmás?")) return;
        setClearStatus("running");
        setClearResult(null);
        setClearError(null);
        try {
            const res = await runClearAllPatients();
            setClearResult(res);
            setClearConfirmText("");
        } catch (e: any) {
            setClearError(e.message ?? "Error desconocido");
        }
        setClearStatus("done");
    }

    async function handleClearAllTreatments() {
        if (!window.confirm("Esto borra TODOS los tratamientos del catálogo de esta clínica (las áreas no se tocan). Es irreversible. ¿Confirmás?")) return;
        setClearTreatStatus("running");
        setClearTreatResult(null);
        setClearTreatError(null);
        try {
            const res = await runClearAllTreatments();
            setClearTreatResult(res.treatments);
            setClearTreatConfirmText("");
        } catch (e: any) {
            setClearTreatError(e.message ?? "Error desconocido");
        }
        setClearTreatStatus("done");
    }

    return (
        <div className="h-screen bg-gray-50 p-10 pb-20 text-black overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6 border-l-4 border-teal-600 pl-4">
                    <h1 className="text-2xl font-bold">Dev — Herramientas internas</h1>
                    <p className="text-sm text-gray-500 mt-1">Solo para uso en desarrollo. No exponer en producción.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* --- Seed: pacientes base --- */}
                    <section className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white flex flex-col">
                        <div className="px-4 py-3 border-b-2 border-teal-600">
                            <h2 className="text-lg font-bold">Seed — Pacientes</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Inserta {SEED_PATIENTS.length} pacientes de ejemplo en Firebase.</p>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0">
                                    <tr className="border-b border-gray-200 bg-gray-100">
                                        <th className="text-left px-4 py-2 font-medium text-gray-500">Nombre</th>
                                        <th className="text-left px-4 py-2 font-medium text-gray-500">DNI</th>
                                        <th className="text-left px-4 py-2 font-medium text-gray-500">Obra Social</th>
                                        <th className="text-left px-4 py-2 font-medium text-gray-500">Plan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {SEED_PATIENTS.map((p, i) => (
                                        <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                            <td className="px-4 py-1.5">{p.name} {p.lastName}</td>
                                            <td className="px-4 py-1.5 text-gray-500">{p.dni}</td>
                                            <td className="px-4 py-1.5">{p.insuranceName}</td>
                                            <td className="px-4 py-1.5 text-gray-500">{p.planName || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-gray-200 mt-auto">
                            <button
                                onClick={handleSeed}
                                disabled={status === "running"}
                                className="w-full px-6 py-3 bg-teal-700 text-white font-semibold rounded-xl hover:bg-teal-600 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {status === "running" ? "Insertando..." : "Insertar pacientes en Firebase"}
                            </button>

                            {error && (
                                <div className="mt-4 border-2 border-red-300 bg-red-50 rounded-xl px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            {result && (
                                <div className="mt-4 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
                                    <p className="font-semibold text-teal-700">✓ {result.ok} pacientes creados correctamente</p>
                                    {result.failed.length > 0 && (
                                        <div className="mt-2">
                                            <p className="font-semibold text-red-600">✗ {result.failed.length} fallidos:</p>
                                            <ul className="mt-1 list-disc pl-5 text-red-500 space-y-0.5">
                                                {result.failed.map((f, i) => <li key={i}>{f}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* --- Seed: 100 pacientes adicionales --- */}
                    <section className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white flex flex-col">
                        <div className="px-4 py-3 border-b-2 border-teal-600">
                            <h2 className="text-lg font-bold">Seed — 100 pacientes adicionales</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Inserta {SEED_PATIENTS_EXTRA.length} nuevos pacientes (no repite los anteriores).</p>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0">
                                    <tr className="border-b border-gray-200 bg-gray-100">
                                        <th className="text-left px-4 py-2 font-medium text-gray-500">Nombre</th>
                                        <th className="text-left px-4 py-2 font-medium text-gray-500">DNI</th>
                                        <th className="text-left px-4 py-2 font-medium text-gray-500">Obra Social</th>
                                        <th className="text-left px-4 py-2 font-medium text-gray-500">Plan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {SEED_PATIENTS_EXTRA.map((p, i) => (
                                        <tr key={i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                            <td className="px-4 py-1.5">{p.name} {p.lastName}</td>
                                            <td className="px-4 py-1.5 text-gray-500">{p.dni}</td>
                                            <td className="px-4 py-1.5">{p.insuranceName}</td>
                                            <td className="px-4 py-1.5 text-gray-500">{p.planName || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-gray-200 mt-auto">
                            <button
                                onClick={handleSeedExtra}
                                disabled={statusExtra === "running"}
                                className="w-full px-6 py-3 bg-teal-700 text-white font-semibold rounded-xl hover:bg-teal-600 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {statusExtra === "running" ? "Insertando..." : `Insertar ${SEED_PATIENTS_EXTRA.length} pacientes adicionales`}
                            </button>

                            {errorExtra && (
                                <div className="mt-4 border-2 border-red-300 bg-red-50 rounded-xl px-4 py-3 text-sm text-red-700">
                                    {errorExtra}
                                </div>
                            )}

                            {resultExtra && (
                                <div className="mt-4 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
                                    <p className="font-semibold text-teal-700">✓ {resultExtra.ok} pacientes creados correctamente</p>
                                    {resultExtra.failed.length > 0 && (
                                        <div className="mt-2">
                                            <p className="font-semibold text-red-600">✗ {resultExtra.failed.length} fallidos:</p>
                                            <ul className="mt-1 list-disc pl-5 text-red-500 space-y-0.5">
                                                {resultExtra.failed.map((f, i) => <li key={i}>{f}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* --- Migración: agregar timestamps --- */}
                    <section className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white flex flex-col">
                        <div className="px-4 py-3 border-b-2 border-orange-500">
                            <h2 className="text-lg font-bold">Migración — Agregar timestamps</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Asigna timestamps secuenciales a pacientes que no tienen el campo.</p>
                        </div>
                        <div className="p-4 mt-auto">
                            <button
                                onClick={handleMigrate}
                                disabled={migrateStatus === "running"}
                                className="w-full px-6 py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-500 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {migrateStatus === "running" ? "Migrando..." : "Ejecutar migración de timestamps"}
                            </button>
                            <p className="text-xs text-orange-500 mt-1">⚠ Puede demorar unos segundos dependiendo de la cantidad de pacientes.</p>

                            {migrateError && (
                                <div className="mt-4 border-2 border-red-300 bg-red-50 rounded-xl px-4 py-3 text-sm text-red-700">
                                    {migrateError}
                                </div>
                            )}

                            {migrateResult && (
                                <div className="mt-4 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
                                    <p className="font-semibold text-orange-600">✓ {migrateResult.updated} actualizados · {migrateResult.skipped} salteados</p>
                                    {migrateResult.failed.length > 0 && (
                                        <div className="mt-2">
                                            <p className="font-semibold text-red-600">✗ {migrateResult.failed.length} fallidos:</p>
                                            <ul className="mt-1 list-disc pl-5 text-red-500 space-y-0.5">
                                                {migrateResult.failed.map((f, i) => <li key={i}>{f}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* --- Seed: odontograma de ejemplo --- */}
                    <section className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white flex flex-col">
                        <div className="px-4 py-3 border-b-2 border-blue-600">
                            <h2 className="text-lg font-bold">Seed — Odontograma de ejemplo</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Carga caries, obturaciones, una pieza ausente, una extracción pendiente, una corona y un
                                puente de tres piezas sobre {SEED_PATIENTS[0]?.name} {SEED_PATIENTS[0]?.lastName}.
                                Idempotente: si ya tiene algo cargado, no toca nada.
                            </p>
                        </div>
                        <div className="p-4 mt-auto">
                            <button
                                onClick={handleSeedOdontograma}
                                disabled={odontoStatus === "running"}
                                className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-500 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {odontoStatus === "running" ? "Cargando..." : "Cargar odontograma de ejemplo"}
                            </button>

                            {odontoError && (
                                <div className="mt-4 border-2 border-red-300 bg-red-50 rounded-xl px-4 py-3 text-sm text-red-700">
                                    {odontoError}
                                </div>
                            )}

                            {odontoResult && (
                                <div className="mt-4 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
                                    <p className={`font-semibold ${odontoResult.ok ? "text-blue-700" : "text-red-600"}`}>
                                        {odontoResult.ok ? "✓" : "✗"} {odontoResult.mensaje}
                                    </p>
                                    {odontoResult.fallidos.length > 0 && (
                                        <ul className="mt-1 list-disc pl-5 text-red-500 space-y-0.5">
                                            {odontoResult.fallidos.map((f, i) => <li key={i}>{f}</li>)}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* --- Seed: odontograma pediátrico (dentición mixta) --- */}
                    <section className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white flex flex-col">
                        <div className="px-4 py-3 border-b-2 border-purple-600">
                            <h2 className="text-lg font-bold">Seed — Odontograma pediátrico</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Carga hallazgos en las cuatro filas de la ficha (permanente y temporaria, superior e
                                inferior) sobre {SEED_PATIENT_PEDIATRICO.name} {SEED_PATIENT_PEDIATRICO.lastName}, incluido
                                un recambio en curso (pieza temporaria ausente + su sucesora permanente). Idempotente: si ya
                                tiene algo cargado, no toca nada.
                            </p>
                        </div>
                        <div className="p-4 mt-auto">
                            <button
                                onClick={handleSeedOdontogramaPediatrico}
                                disabled={odontoPedStatus === "running"}
                                className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-500 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {odontoPedStatus === "running" ? "Cargando..." : "Cargar odontograma pediátrico"}
                            </button>

                            {odontoPedError && (
                                <div className="mt-4 border-2 border-red-300 bg-red-50 rounded-xl px-4 py-3 text-sm text-red-700">
                                    {odontoPedError}
                                </div>
                            )}

                            {odontoPedResult && (
                                <div className="mt-4 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
                                    <p className={`font-semibold ${odontoPedResult.ok ? "text-purple-700" : "text-red-600"}`}>
                                        {odontoPedResult.ok ? "✓" : "✗"} {odontoPedResult.mensaje}
                                    </p>
                                    {odontoPedResult.fallidos.length > 0 && (
                                        <ul className="mt-1 list-disc pl-5 text-red-500 space-y-0.5">
                                            {odontoPedResult.fallidos.map((f, i) => <li key={i}>{f}</li>)}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* --- Peligroso: borrar TODOS los pacientes --- */}
                    <section className="border-2 border-red-300 rounded-xl overflow-hidden bg-white flex flex-col lg:col-span-2">
                        <div className="px-4 py-3 border-b-2 border-red-600">
                            <h2 className="text-lg font-bold text-red-700">⚠ Borrar todos los pacientes</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Elimina TODOS los pacientes de esta clínica, sus turnos y el estado actual de sus
                                odontogramas (el log de eventos no se toca — es append-only por reglas de Firebase).
                                Irreversible — no hay papelera en Realtime Database. Escribí <b>BORRAR</b> para habilitar el botón.
                            </p>
                        </div>
                        <div className="p-4">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <input
                                    type="text"
                                    value={clearConfirmText}
                                    onChange={(e) => setClearConfirmText(e.target.value)}
                                    placeholder="Escribí BORRAR para confirmar"
                                    className="h-11 flex-1 px-3 border-2 border-red-300 rounded-xl text-sm text-black focus:outline-red-600"
                                />
                                <button
                                    onClick={handleClearAllPatients}
                                    disabled={clearConfirmText !== "BORRAR" || clearStatus === "running"}
                                    className="shrink-0 px-6 py-3 bg-red-700 text-white font-semibold rounded-xl hover:bg-red-600 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {clearStatus === "running" ? "Borrando..." : "Borrar todos los pacientes"}
                                </button>
                            </div>

                            {clearError && (
                                <div className="mt-4 border-2 border-red-300 bg-red-50 rounded-xl px-4 py-3 text-sm text-red-700">
                                    {clearError}
                                </div>
                            )}

                            {clearResult && (
                                <div className="mt-4 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
                                    <p className="font-semibold text-red-700">
                                        ✓ {clearResult.patients} pacientes, {clearResult.appointments} turnos y {clearResult.odontogramas} odontogramas eliminados
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* --- Peligroso: borrar TODOS los tratamientos --- */}
                    <section className="border-2 border-red-300 rounded-xl overflow-hidden bg-white flex flex-col lg:col-span-2">
                        <div className="px-4 py-3 border-b-2 border-red-600">
                            <h2 className="text-lg font-bold text-red-700">⚠ Borrar todos los tratamientos</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Elimina TODOS los tratamientos del catálogo de esta clínica (las áreas no se tocan).
                                Irreversible — no hay papelera en Realtime Database. Escribí <b>BORRAR</b> para habilitar el botón.
                            </p>
                        </div>
                        <div className="p-4">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <input
                                    type="text"
                                    value={clearTreatConfirmText}
                                    onChange={(e) => setClearTreatConfirmText(e.target.value)}
                                    placeholder="Escribí BORRAR para confirmar"
                                    className="h-11 flex-1 px-3 border-2 border-red-300 rounded-xl text-sm text-black focus:outline-red-600"
                                />
                                <button
                                    onClick={handleClearAllTreatments}
                                    disabled={clearTreatConfirmText !== "BORRAR" || clearTreatStatus === "running"}
                                    className="shrink-0 px-6 py-3 bg-red-700 text-white font-semibold rounded-xl hover:bg-red-600 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {clearTreatStatus === "running" ? "Borrando..." : "Borrar todos los tratamientos"}
                                </button>
                            </div>
                            {clearTreatError && (
                                <div className="mt-4 border-2 border-red-300 bg-red-50 rounded-xl px-4 py-3 text-sm text-red-700">
                                    {clearTreatError}
                                </div>
                            )}
                            {clearTreatResult !== null && (
                                <div className="mt-4 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm">
                                    <p className="font-semibold text-red-700">✓ {clearTreatResult} tratamientos eliminados</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
