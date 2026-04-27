'use client'
import { useState } from "react";
import { runSeedPatients, SEED_PATIENTS } from "../../dev/seedPatients";

export default function DevPage() {
    const [status, setStatus] = useState<"idle" | "running" | "done">("idle");
    const [result, setResult] = useState<{ ok: number; failed: string[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function handleSeed() {
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

    return (
        <div className="min-h-screen bg-gray-50 p-10 text-black">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6 border-l-4 border-teal-600 pl-4">
                    <h1 className="text-2xl font-bold">Dev — Seed Pacientes</h1>
                    <p className="text-sm text-gray-500 mt-1">Solo para uso en desarrollo. No exponer en producción.</p>
                </div>

                {/* Lista de pacientes a insertar */}
                <div className="mb-6 border-2 border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600">
                        {SEED_PATIENTS.length} pacientes a insertar
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 bg-white">
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

                <button
                    onClick={handleSeed}
                    disabled={status === "running"}
                    className="px-6 py-3 bg-teal-700 text-white font-semibold rounded-xl hover:bg-teal-600 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
    );
}
