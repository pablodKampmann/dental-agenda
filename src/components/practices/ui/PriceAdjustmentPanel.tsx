import { useState, useEffect } from 'react';
import { ClipLoader } from "react-spinners";
import { RiAlertFill } from "react-icons/ri";
import { IoLogoUsd } from "react-icons/io5";
import { getChapter } from './../../../services/practices/getChapter';

interface GlobalResult {
    updated: number;
    areas: number;
    failed: string[];
}

interface Props {
    chapterData: any[];
    chapterName: string;
    openFormPercentages: boolean;
    setOpenFormPercentages: (value: boolean) => void;
    percentage: any;
    percentageVisible: any;
    setPercentage: (value: any) => void;
    setPercentageVisible: (value: any) => void;
    loadingIncreaseOrDecrease: boolean;
    handleIncreaseOrDecrease: () => void;
    globalPercentage: number | null;
    globalPercentageVisible: string | null;
    setGlobalPercentage: (value: number | null) => void;
    setGlobalPercentageVisible: (value: string | null) => void;
    openGlobalFormPercentages: boolean;
    setOpenGlobalFormPercentages: (value: boolean) => void;
    loadingGlobal: boolean;
    globalResult: GlobalResult | null;
    setGlobalResult: (value: GlobalResult | null) => void;
    handleGlobalUpdate: () => void;
    formatPrice: (price: number) => string;
}

const ALL_AREAS = [
    "CONSULTAS", "OPERATORIA DENTAL", "ENDODONCIA", "PRÓTESIS",
    "ODONTOLOGÍA PREVENTIVA", "ORTODONCIA Y ORTOPEDIA FUNCIONAL",
    "ODONTOPEDIATRÍA", "PERIODONCIA", "RADIOLOGÍA", "CIRUGÍA",
];

export function PriceAdjustmentPanel({
    chapterData, chapterName,
    openFormPercentages, setOpenFormPercentages,
    percentage, percentageVisible, setPercentage, setPercentageVisible,
    loadingIncreaseOrDecrease, handleIncreaseOrDecrease,
    globalPercentageVisible, setGlobalPercentage, setGlobalPercentageVisible,
    openGlobalFormPercentages, setOpenGlobalFormPercentages,
    loadingGlobal, globalResult, setGlobalResult, handleGlobalUpdate,
    formatPrice,
}: Props) {
    const [scope, setScope] = useState<'area' | 'global'>('area');
    const [customValue, setCustomValue] = useState('');
    const [customMode, setCustomMode] = useState<'increase' | 'decrease' | null>(null);
    const [allAreasCount, setAllAreasCount] = useState(0);

    const isAreaConfirm = openFormPercentages;
    const isGlobalConfirm = openGlobalFormPercentages;
    const areaDisabled = scope === 'area' && chapterData.length === 0;

    useEffect(() => {
        if (scope !== 'global') return;
        setAllAreasCount(0);
        (async () => {
            let total = 0;
            for (const area of ALL_AREAS) {
                const { data } = await getChapter(area);
                if (Array.isArray(data)) {
                    total += data.filter((item) => !Object.values(item).every((v) => v === undefined)).length;
                }
            }
            setAllAreasCount(total);
        })();
    }, [scope]);

    function applyPercentage(pct: number, label: string) {
        setCustomMode(null);
        setCustomValue('');
        if (scope === 'area') {
            setPercentageVisible(label);
            setPercentage(pct);
            setOpenFormPercentages(true);
        } else {
            setGlobalPercentage(pct);
            setGlobalPercentageVisible(label);
            setGlobalResult(null);
            setOpenGlobalFormPercentages(true);
        }
    }

    function handleScopeChange(newScope: 'area' | 'global') {
        setScope(newScope);
        setCustomMode(null);
        setCustomValue('');
    }

    const previewPrice = chapterData.length > 0 && percentage !== null
        ? Math.round(chapterData[0].price + chapterData[0].price * percentage)
        : null;

    // ── Confirmación por área ──
    if (isAreaConfirm) return (
        <div className="overflow-hidden w-1/5">
            <div className="animate-move-from-right-form text-black border-2 border-gray-600 ml-auto mr-6 shadow-lg rounded-lg select-none bg-gray-300 bg-opacity-30">
                <h2 className="bg-teal-600 rounded-t-md text-white text-center font-semibold text-lg py-2 border-b-2 border-gray-600">
                    Ajuste de Precios
                </h2>
                <div className="flex flex-col items-center p-5 gap-3">
                    <RiAlertFill className="text-yellow-500" size={52} />
                    <p className="text-center text-sm font-medium leading-snug">
                        {percentage > 0
                            ? <>Vas a <span className="text-teal-700 font-bold">aumentar</span> todos los precios de</>
                            : <>Vas a <span className="text-red-600 font-bold">disminuir</span> todos los precios de</>
                        }
                    </p>
                    <p className="text-center text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-300 rounded-lg px-3 py-1 w-full truncate">
                        {chapterName}
                    </p>
                    <div className="flex items-center gap-2 text-2xl font-bold">
                        <span className={percentage > 0 ? 'text-teal-700' : 'text-red-600'}>{percentageVisible}</span>
                    </div>
                    {scope === 'area' && chapterData.length > 0 && previewPrice !== null && (
                        <p className="text-xs text-gray-500 text-center">
                            Ej: ${formatPrice(chapterData[0].price)} → <span className="font-semibold text-teal-700">${formatPrice(previewPrice)}</span>
                        </p>
                    )}
                    <div className="flex gap-2 w-full mt-2">
                        <button
                            onClick={() => setOpenFormPercentages(false)}
                            className="flex-1 py-2 border-2 border-gray-600 rounded-lg font-semibold text-black hover:bg-gray-200 transition duration-150"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleIncreaseOrDecrease}
                            className="flex-1 py-2 bg-teal-600 border-2 border-gray-600 rounded-lg font-semibold text-white hover:bg-teal-500 transition duration-150"
                        >
                            {loadingIncreaseOrDecrease
                                ? <div className="flex justify-center"><ClipLoader color="white" size={20} /></div>
                                : 'Confirmar'
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── Confirmación global ──
    if (isGlobalConfirm) return (
        <div className="overflow-hidden w-1/5">
            <div className="animate-move-from-right-form text-black border-2 border-gray-600 ml-auto mr-6 shadow-lg rounded-lg select-none bg-gray-300 bg-opacity-30">
                <h2 className="bg-teal-600 rounded-t-md text-white text-center font-semibold text-lg py-2 border-b-2 border-gray-600">
                    Ajuste de Precios
                </h2>
                <div className="flex flex-col items-center p-5 gap-3">
                    <RiAlertFill className="text-yellow-500" size={52} />
                    <p className="text-center text-sm font-medium">
                        Vas a actualizar <span className="font-bold">todas las áreas</span>
                    </p>
                    <div className="flex items-center gap-2 text-2xl font-bold">
                        <span className={globalPercentageVisible?.startsWith('+') ? 'text-teal-700' : 'text-red-600'}>
                            {globalPercentageVisible}
                        </span>
                    </div>
                    <ul className="w-full text-xs text-gray-600 space-y-1 bg-white border border-gray-300 rounded-lg px-3 py-2">
                        {ALL_AREAS.map((area) => (
                            <li key={area} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block flex-shrink-0" />
                                {area}
                            </li>
                        ))}
                    </ul>
                    <p className="text-xs text-gray-500">
                        {allAreasCount > 0
                            ? <><span className="font-bold text-black">{allAreasCount}</span> prácticas en total</>
                            : <span className="italic">Calculando...</span>
                        }
                    </p>
                    <div className="flex gap-2 w-full mt-1">
                        <button
                            onClick={() => setOpenGlobalFormPercentages(false)}
                            className="flex-1 py-2 border-2 border-gray-600 rounded-lg font-semibold text-black hover:bg-gray-200 transition duration-150"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGlobalUpdate}
                            disabled={loadingGlobal}
                            className="flex-1 py-2 bg-teal-600 border-2 border-gray-600 rounded-lg font-semibold text-white hover:bg-teal-500 transition duration-150 disabled:opacity-60"
                        >
                            {loadingGlobal
                                ? <div className="flex justify-center"><ClipLoader color="white" size={20} /></div>
                                : 'Confirmar'
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ── Vista normal ──
    return (
        <div className="overflow-hidden w-1/5">
            <div className="animate-move-from-right-form text-black border-2 border-gray-600 ml-auto mr-6 shadow-lg rounded-lg select-none bg-gray-300 bg-opacity-30">

                {/* Header */}
                <h2 className="bg-teal-600 rounded-t-md text-white text-center font-semibold text-lg py-2 border-b-2 border-gray-600 flex items-center justify-center gap-2">
                    <IoLogoUsd size={20} />
                    Ajuste de Precios
                </h2>

                {/* Toggle scope */}
                <div className="flex border-b-2 border-gray-600 bg-teal-600 bg-opacity-10">
                    <button
                        onClick={() => handleScopeChange('area')}
                        className={`flex-1 py-1.5 text-xs font-semibold transition duration-150 ${scope === 'area' ? 'bg-white text-teal-700 border-b-2 border-teal-600' : 'text-gray-500 hover:text-black'}`}
                    >
                        Solo esta área
                    </button>
                    <button
                        onClick={() => handleScopeChange('global')}
                        className={`flex-1 py-1.5 text-xs font-semibold border-l-2 border-gray-600 transition duration-150 ${scope === 'global' ? 'bg-white text-teal-700 border-b-2 border-teal-600' : 'text-gray-500 hover:text-black'}`}
                    >
                        Todas las áreas
                    </button>
                </div>

                {/* Scope label */}
                <div className="px-3 py-1.5 border-b-2 border-gray-600 bg-white bg-opacity-50">
                    {scope === 'area' ? (
                        <p className={`text-xs font-semibold text-center truncate ${areaDisabled ? 'line-through text-gray-400' : 'text-teal-700'}`}>
                            {chapterName}
                            {areaDisabled && <span className="ml-1 font-normal text-gray-400">(sin prácticas)</span>}
                        </p>
                    ) : (
                        <p className="text-xs font-semibold text-center text-teal-700">
                            10 áreas · {allAreasCount > 0 ? `${allAreasCount} prácticas` : <span className="italic font-normal text-gray-400">calculando...</span>}
                        </p>
                    )}
                </div>

                {/* Resultado global */}
                {globalResult && (
                    <div className={`mx-3 mt-2 px-3 py-2 rounded-lg text-xs font-medium border-2 ${globalResult.failed.length > 0 ? 'bg-red-50 text-red-700 border-red-300' : 'bg-teal-50 text-teal-800 border-teal-300'}`}>
                        {globalResult.failed.length > 0
                            ? `${globalResult.updated} prácticas actualizadas. Fallaron: ${globalResult.failed.join(', ')}`
                            : `✓ ${globalResult.updated} prácticas actualizadas en ${globalResult.areas} áreas`
                        }
                    </div>
                )}

                {/* Botones */}
                <div className={areaDisabled ? 'pointer-events-none opacity-40' : ''}>

                    {/* AUMENTAR */}
                    <div className="px-3 pt-3 pb-1">
                        <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">↑ Aumentar</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {['+5%', '+10%', '+15%', '+20%'].map((label) => {
                                const pct = parseFloat(label) / 100;
                                return (
                                    <button
                                        key={label}
                                        onClick={() => applyPercentage(pct, label)}
                                        className="py-2 bg-white border-2 border-gray-600 rounded-lg font-semibold text-sm text-teal-700 hover:bg-teal-600 hover:text-white hover:border-teal-600 transition duration-150"
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        {customMode === 'increase' ? (
                            <div className="flex mt-1.5 border-2 border-teal-600 rounded-lg overflow-hidden">
                                <input
                                    autoFocus
                                    value={customValue}
                                    placeholder="Ej: 25%"
                                    type="text"
                                    className="bg-white w-48 h-10 text-center text-sm font-semibold focus:outline-none text-black"
                                    onChange={(e) => setCustomValue(e.target.value.replace(/\D/g, ''))}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && customValue) applyPercentage(parseFloat(customValue) / 100, '+' + customValue + '%'); if (e.key === 'Escape') { setCustomMode(null); setCustomValue(''); } }}
                                />
                                <button
                                    onClick={() => { setCustomMode(null); setCustomValue(''); }}
                                    className="px-2 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black transition duration-150 font-bold"
                                >
                                    ✕
                                </button>
                                <button
                                    onClick={() => { if (customValue) applyPercentage(parseFloat(customValue) / 100, '+' + customValue + '%'); }}
                                    className="flex-1 bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 transition duration-150"
                                >
                                    Aplicar
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setCustomMode('increase'); setCustomValue(''); }}
                                className="mt-1.5 w-full py-2.5 border-2 border-dashed border-gray-400 rounded-lg text-sm font-semibold text-gray-500 hover:border-teal-600 hover:text-teal-700 transition duration-150"
                            >
                                + Personalizar
                            </button>
                        )}
                    </div>

                    <div className="mx-3 my-2 border-t-2 border-gray-300" />

                    {/* DISMINUIR */}
                    <div className="px-3 pb-3">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2">↓ Disminuir</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {['-5%', '-10%', '-15%', '-20%'].map((label) => {
                                const pct = parseFloat(label) / 100;
                                return (
                                    <button
                                        key={label}
                                        onClick={() => applyPercentage(pct, label)}
                                        className="py-2 bg-white border-2 border-gray-600 rounded-lg font-semibold text-sm text-red-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition duration-150"
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        {customMode === 'decrease' ? (
                            <div className="flex mt-1.5 border-2 border-red-600 rounded-lg overflow-hidden">
                                <input
                                    autoFocus
                                    value={customValue}
                                    placeholder="Ej: 25%"
                                    type="text"
                                    className="bg-white w-48 h-10 text-center text-sm font-semibold focus:outline-none text-black"
                                    onChange={(e) => setCustomValue(e.target.value.replace(/\D/g, ''))}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && customValue) applyPercentage(-(parseFloat(customValue) / 100), '-' + customValue + '%'); if (e.key === 'Escape') { setCustomMode(null); setCustomValue(''); } }}
                                />
                                <button
                                    onClick={() => { setCustomMode(null); setCustomValue(''); }}
                                    className="px-2 bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black transition duration-150 font-bold"
                                >
                                    ✕
                                </button>
                                <button
                                    onClick={() => { if (customValue) applyPercentage(-(parseFloat(customValue) / 100), '-' + customValue + '%'); }}
                                    className="flex-1 bg-red-600 text-white text-sm font-semibold hover:bg-red-400 transition duration-150"
                                >
                                    Aplicar
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setCustomMode('decrease'); setCustomValue(''); }}
                                className="mt-1.5 w-full py-2 border-2 border-dashed border-gray-400 rounded-lg text-xs font-semibold text-gray-500 hover:border-red-500 hover:text-red-600 transition duration-150"
                            >
                                + Personalizar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}