'use client'
import { useState, useEffect } from "react";
import { getInsuranceOptions } from "../options/getInsuranceOpt";
import { getInsurancePlans } from "../options/getInsurancePlans";
import { addInsurance } from "../options/addInsurance";
import { addInsurancePlan } from "../options/addInsurancePlan";
import { deleteInsurance } from "../options/deleteInsurance";
import { deleteInsurancePlan } from "../options/deleteInsurancePlan";
import { MoonLoader } from "react-spinners";
import { FaCircleXmark } from "react-icons/fa6";
import { IoChevronDownOutline, IoChevronUpOutline } from "react-icons/io5";

interface InsuranceOption { id: string; name: string; }
interface PlanOption { id: string; name: string; }

const INPUT_CLS = "border-2 border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-teal-700 bg-gray-100 text-black w-full";

export function InsurancesConfig() {
    const [insurances, setInsurances] = useState<InsuranceOption[] | null>(null);
    const [plans, setPlans] = useState<Record<string, PlanOption[]>>({});
    const [loadingPlans, setLoadingPlans] = useState<Record<string, boolean>>({});
    const [expanded, setExpanded] = useState<string | null>(null);

    const [newInsuranceName, setNewInsuranceName] = useState("");
    const [addingInsurance, setAddingInsurance] = useState(false);

    const [newPlanName, setNewPlanName] = useState<Record<string, string>>({});
    const [addingPlan, setAddingPlan] = useState<Record<string, boolean>>({});

    const [confirmDeleteInsurance, setConfirmDeleteInsurance] = useState<string | null>(null);
    const [confirmDeletePlan, setConfirmDeletePlan] = useState<Record<string, string | null>>({});

    useEffect(() => {
        getInsuranceOptions().then(opts => setInsurances(opts ?? []));
    }, []);

    async function toggleExpand(id: string) {
        if (expanded === id) { setExpanded(null); return; }
        setExpanded(id);
        if (!plans[id]) {
            setLoadingPlans(prev => ({ ...prev, [id]: true }));
            const result = await getInsurancePlans(id);
            setPlans(prev => ({ ...prev, [id]: result ?? [] }));
            setLoadingPlans(prev => ({ ...prev, [id]: false }));
        }
    }

    async function handleAddInsurance() {
        if (!newInsuranceName.trim()) return;
        setAddingInsurance(true);
        const result = await addInsurance(newInsuranceName.trim());
        if (result) setInsurances(prev => prev ? [...prev, result] : [result]);
        setNewInsuranceName("");
        setAddingInsurance(false);
    }

    async function handleDeleteInsurance(id: string) {
        const ok = await deleteInsurance(id);
        if (ok) {
            setInsurances(prev => prev ? prev.filter(i => i.id !== id) : prev);
            if (expanded === id) setExpanded(null);
        }
    }

    async function handleAddPlan(insuranceId: string) {
        const name = newPlanName[insuranceId]?.trim();
        if (!name) return;
        setAddingPlan(prev => ({ ...prev, [insuranceId]: true }));
        const result = await addInsurancePlan(insuranceId, name);
        if (result) setPlans(prev => ({ ...prev, [insuranceId]: [...(prev[insuranceId] ?? []), result] }));
        setNewPlanName(prev => ({ ...prev, [insuranceId]: "" }));
        setAddingPlan(prev => ({ ...prev, [insuranceId]: false }));
    }

    async function handleDeletePlan(insuranceId: string, planId: string) {
        const ok = await deleteInsurancePlan(insuranceId, planId);
        if (ok) setPlans(prev => ({ ...prev, [insuranceId]: prev[insuranceId].filter(p => p.id !== planId) }));
    }

    if (!insurances) {
        return <div className="flex justify-center mt-8"><MoonLoader size={28} color="#0f766e" /></div>;
    }

    return (
        <div className="max-w-lg">
            <h1 className="text-base font-bold tracking-wide mb-3">Obras Sociales</h1>

            <div className="flex flex-col gap-2 mb-4">
                {insurances.map((ins) => (
                    <div key={ins.id} className="border-2 border-gray-300 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                            <button
                                onClick={() => toggleExpand(ins.id)}
                                className="flex items-center gap-2 text-sm font-semibold text-black hover:text-teal-700 transition duration-150"
                            >
                                {expanded === ins.id ? <IoChevronUpOutline size={16} /> : <IoChevronDownOutline size={16} />}
                                {ins.name}
                            </button>
                            {confirmDeleteInsurance === ins.id ? (
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-red-600 font-semibold">¿Borrar?</span>
                                    <button onClick={() => { setConfirmDeleteInsurance(null); handleDeleteInsurance(ins.id); }} className="text-red-600 font-bold hover:underline">Sí</button>
                                    <button onClick={() => setConfirmDeleteInsurance(null)} className="text-gray-500 hover:underline">No</button>
                                </div>
                            ) : (
                                <button onClick={() => setConfirmDeleteInsurance(ins.id)} className="text-gray-400 hover:text-red-600 transition duration-150">
                                    <FaCircleXmark size={18} />
                                </button>
                            )}
                        </div>

                        {expanded === ins.id && (
                            <div className="px-4 py-3 border-t border-gray-200 bg-white">
                                {loadingPlans[ins.id] ? (
                                    <div className="flex justify-center py-2"><MoonLoader size={18} color="#0f766e" /></div>
                                ) : (
                                    <>
                                        {(plans[ins.id] ?? []).length === 0 ? (
                                            <p className="text-xs text-gray-400 mb-2">Sin planes cargados.</p>
                                        ) : (
                                            <div className="flex flex-col gap-1 mb-3">
                                                {plans[ins.id].map((p) => (
                                                    <div key={p.id} className="flex items-center justify-between py-0.5 px-2 rounded-lg hover:bg-gray-100 group">
                                                        <span className="text-sm text-black">{p.name}</span>
                                                        {confirmDeletePlan[ins.id] === p.id ? (
                                                            <div className="flex items-center gap-1.5 text-xs">
                                                                <span className="text-red-600 font-semibold">¿Borrar?</span>
                                                                <button onClick={() => { setConfirmDeletePlan(prev => ({ ...prev, [ins.id]: null })); handleDeletePlan(ins.id, p.id); }} className="text-red-600 font-bold hover:underline">Sí</button>
                                                                <button onClick={() => setConfirmDeletePlan(prev => ({ ...prev, [ins.id]: null }))} className="text-gray-500 hover:underline">No</button>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => setConfirmDeletePlan(prev => ({ ...prev, [ins.id]: p.id }))} className="text-gray-300 group-hover:text-red-500 transition duration-150">
                                                                <FaCircleXmark size={15} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Nuevo plan..."
                                                value={newPlanName[ins.id] ?? ""}
                                                onChange={(e) => setNewPlanName(prev => ({ ...prev, [ins.id]: e.target.value }))}
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPlan(ins.id); } }}
                                                className={INPUT_CLS}
                                            />
                                            <button
                                                onClick={() => handleAddPlan(ins.id)}
                                                disabled={addingPlan[ins.id]}
                                                className="px-3 py-1.5 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition duration-150 whitespace-nowrap disabled:opacity-50"
                                            >
                                                + Agregar
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Nueva obra social..."
                    value={newInsuranceName}
                    onChange={(e) => setNewInsuranceName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInsurance(); } }}
                    className={INPUT_CLS}
                />
                <button
                    onClick={handleAddInsurance}
                    disabled={addingInsurance}
                    className="px-3 py-1.5 text-sm font-semibold bg-teal-700 text-white rounded-lg hover:bg-teal-600 transition duration-150 whitespace-nowrap disabled:opacity-50"
                >
                    + Agregar
                </button>
            </div>
        </div>
    );
}
