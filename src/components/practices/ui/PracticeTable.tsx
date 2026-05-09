import React from 'react';
import { MdDelete } from "react-icons/md";
import { FaPen } from "react-icons/fa";
import { IoLogoUsd } from "react-icons/io5";
import { FaRegCircleCheck, FaRegCircleXmark } from "react-icons/fa6";
import { BsClipboardCheck } from "react-icons/bs";
import { TiDocumentDelete } from "react-icons/ti";
import { RiAlertFill } from "react-icons/ri";

interface Props {
    chapterName: string;
    chapterData: any[];
    openPriceEdit: boolean[];
    newPrice: any;
    setNewPrice: (value: any) => void;
    billingTagetOverflowActived: boolean;
    billingTargetRef: React.RefObject<any>;
    showResult: string | null;
    togglePriceEdit: (index: number) => void;
    cancelEdit: () => void;
    handleUpdatePrice: (practiceId: string) => void;
    handleKeyPress: (event: any, practiceId: string) => void;
    setOpenAlert: (value: string) => void;
    setId: (value: any) => void;
    setPracticeName: (value: any) => void;
    setPrice: (value: any) => void;
    formatPrice: (price: number) => string;
    onAddPractice: () => void;
}

export function PracticeTable({
    chapterData, chapterName, openPriceEdit, newPrice, setNewPrice,
    billingTagetOverflowActived, billingTargetRef, showResult,
    togglePriceEdit, cancelEdit, handleUpdatePrice, handleKeyPress,
    setOpenAlert, setId, setPracticeName, setPrice,
    formatPrice, onAddPractice
}: Props) {
    const isAnyEditing = openPriceEdit.some(Boolean);

    return (
        <div
            id="billing-target"
            className="mx-6 mr-8 rounded-lg w-full h-full border-2 border-gray-600 flex-1 overflow-y-auto bg-gray-300 bg-opacity-30 overflow-x-hidden shadow-lg"
        >
            {/* Header sticky */}
            <div
                ref={billingTargetRef}
                className={`${billingTagetOverflowActived ? "rounded-tl-md" : "rounded-t-md"} sticky top-0 z-20 bg-teal-600 text-3xl pb-1.5 text-center py-1 select-none font-medium border-b-2 border-gray-600`}
            >
                <h1>Aranceles <span className="text-white font-black text-xl">({chapterName})</span></h1>
                {showResult === "good-practice" && (
                    <div className="absolute top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-emerald-400 transform animate-messagge-from-right">
                        <BsClipboardCheck className="text-black" size={26} />
                        <p className="ml-2 text-black font-semibold text-lg select-none">Práctica agregada exitosamente</p>
                    </div>
                )}
                {showResult === "good-delete-practice" && (
                    <div className="absolute top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-emerald-400 transform animate-messagge-from-right">
                        <TiDocumentDelete className="text-black" size={28} />
                        <p className="ml-1 text-black font-semibold text-lg select-none">La práctica fue eliminada</p>
                    </div>
                )}
                {showResult === "good-prices-update" && (
                    <div className="absolute top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-emerald-400 transform animate-messagge-from-right">
                        <IoLogoUsd className="text-black" size={24} />
                        <p className="ml-1 text-black font-semibold text-lg select-none">Los precios han sido actualizados</p>
                    </div>
                )}
                {showResult === "no-practices" && (
                    <div className="absolute top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-red-500 transform animate-messagge-from-right">
                        <RiAlertFill className="text-black" size={24} />
                        <p className="ml-1 text-black font-semibold text-lg select-none">No tenés prácticas cargadas</p>
                    </div>
                )}
                {showResult === "good-price-update" && (
                    <div className="absolute top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-emerald-400 transform animate-messagge-from-right">
                        <IoLogoUsd className="text-black" size={24} />
                        <p className="ml-1 text-black font-semibold text-lg select-none">El precio fue actualizado</p>
                    </div>
                )}
            </div>

            <table className="w-full select-none">
                {/* Thead separado del header, con top calculado para no pisarse */}
                <thead className="sticky top-[45px] z-10">
                    <tr className="border-b-2 border-gray-600 bg-white select-none text-left text-xs font-semibold uppercase tracking-widest text-black">
                        <th className="text-center py-3 w-16 border-r-2 border-gray-600">N°</th>
                        <th className="pl-3 py-3 border-r-2 border-gray-600">Nombre de Práctica</th>
                        <th className="pl-5 py-3 w-56 border-r-2 border-gray-600">Precio</th>
                        <th className="text-center py-3 w-20">Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {chapterData.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="py-16 text-center text-black">
                                <div className="flex flex-col items-center gap-3">
                                    <BsClipboardCheck size={48} className="text-gray-400" />
                                    <p className="text-gray-500 text-base font-medium">No hay prácticas cargadas en esta área</p>
                                    <button
                                        onClick={onAddPractice}
                                        className="mt-1 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-md transition duration-200"
                                    >
                                        Agregar primera práctica
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ) : null}

                    {chapterData.map((practice: any, index: any) => {
                        const isEditing = openPriceEdit[index];
                        const isDimmed = isAnyEditing && !isEditing;

                        return (
                            <tr
                                key={index}
                                className={`
                                    border-b-2 border-gray-600
                                    transition-opacity duration-200
                                    ${isDimmed ? "opacity-35" : "opacity-100"}
                                `}
                            >
                                {/* Número — tamaño fijo para que no se deforme */}
                                <td className="px-3 py-3 whitespace-nowrap border-r-2 border-gray-600 w-16">
                                    <div className="flex items-center justify-center">
                                        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-teal-600 text-white text-xs font-bold flex-shrink-0">
                                            {index + 1}
                                        </div>
                                    </div>
                                </td>

                                {/* Nombre con max-w para no explotar en pantallas chicas */}
                                <td className="px-3 py-4 text-black text-sm border-r-2 border-gray-600 max-w-xs">
                                    <p className="break-words">{practice.name}</p>
                                </td>

                                {/* Precio — hover sutil, solo lápiz */}
                                {isEditing ? (
                                    <td className="whitespace-nowrap w-auto text-black px-3 bg-teal-50 border-r-2 border-gray-600 transition duration-150">
                                        <div className="flex justify-between items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <IoLogoUsd size={20} className="text-teal-600 flex-shrink-0" />
                                                <input
                                                    defaultValue={formatPrice(practice.price)}
                                                    value={newPrice}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, "");
                                                        setNewPrice(value.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
                                                    }}
                                                    type="text"
                                                    autoFocus
                                                    onKeyDown={(event) => handleKeyPress(event, practice.id)}
                                                    className="font-semibold w-36 h-8 outline-none text-black bg-white border-2 border-teal-400 rounded-md px-2 text-base"
                                                />
                                            </div>
                                            <div className="flex gap-1">
                                                <FaRegCircleCheck
                                                    size={24}
                                                    onClick={() => handleUpdatePrice(practice.id)}
                                                    className="cursor-pointer text-teal-600 hover:scale-125 hover:text-teal-800 transition duration-150"
                                                />
                                                <FaRegCircleXmark
                                                    size={24}
                                                    onClick={cancelEdit}
                                                    className="cursor-pointer text-gray-500 hover:scale-125 hover:text-red-600 transition duration-150"
                                                />
                                            </div>
                                        </div>
                                    </td>
                                ) : (
                                    <td
                                        onClick={() => !isDimmed && togglePriceEdit(index)}
                                        className={`
                                            px-5 whitespace-nowrap w-auto text-black py-4 border-r-2 border-gray-600
                                            transition duration-150 group
                                            ${isDimmed ? "cursor-default" : "cursor-pointer hover:bg-gray-100"}
                                        `}
                                    >
                                        <div className="flex justify-between items-center">
                                            <p className="font-medium">${formatPrice(practice.price)}</p>
                                            {!isDimmed && (
                                                <FaPen size={13} className="text-gray-300 group-hover:text-teal-600 transition duration-150 ml-2" />
                                            )}
                                        </div>
                                    </td>
                                )}

                                {/* Acciones — eliminar centrado */}
                                <td
                                    onClick={() => {
                                        if (isDimmed) return;
                                        setOpenAlert("delete");
                                        setId(practice.id);
                                        setPracticeName(practice.name);
                                        setPrice(formatPrice(practice.price));
                                    }}
                                    className={`
                                        whitespace-nowrap w-20 text-center
                                        transition duration-150 group
                                        ${isDimmed ? "cursor-default opacity-30" : "cursor-pointer hover:bg-red-50"}
                                    `}
                                >
                                    <div className="flex justify-center items-center py-4">
                                        <MdDelete
                                            size={22}
                                            className="text-gray-400 group-hover:text-red-600 group-hover:scale-125 transform transition duration-150"
                                        />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
