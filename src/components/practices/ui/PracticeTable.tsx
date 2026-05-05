import React from 'react';
import { MdDelete } from "react-icons/md";
import { FaPen } from "react-icons/fa";
import { IoLogoUsd } from "react-icons/io5";
import { FaRegCircleCheck, FaRegCircleXmark } from "react-icons/fa6";
import { BsClipboardCheck } from "react-icons/bs";
import { TiDocumentDelete } from "react-icons/ti";
import { RiAlertFill } from "react-icons/ri";

interface Props {
    chapterData: any[];
    chapterNum: string;
    openPriceEdit: boolean[];
    newPrice: any;
    setNewPrice: (value: any) => void;
    billingTagetOverflowActived: boolean;
    billingTargetRef: React.RefObject<any>;
    showResult: string | null;
    togglePriceEdit: (index: number) => void;
    cancelEdit: () => void;
    handleUpdatePrice: (practiceId: number) => void;
    handleKeyPress: (event: any, practiceId: number) => void;
    setOpenAlert: (value: string) => void;
    setId: (value: any) => void;
    setPracticeName: (value: any) => void;
    setPrice: (value: any) => void;
    formatPrice: (price: number) => string;
    formattedIdFromRoman: (numberInRoman: string) => string;
}

export function PracticeTable({
    chapterData, chapterNum, openPriceEdit, newPrice, setNewPrice,
    billingTagetOverflowActived, billingTargetRef, showResult,
    togglePriceEdit, cancelEdit, handleUpdatePrice, handleKeyPress,
    setOpenAlert, setId, setPracticeName, setPrice,
    formatPrice, formattedIdFromRoman
}: Props) {
    return (
        <div
            id="billing-target"
            className="mx-6 mr-8 rounded-lg w-full h-full border-2 border-gray-600 flex-1 overflow-y-auto bg-gray-300 bg-opacity-30 overflow-x-hidden shadow-lg"
        >
            <div
                ref={billingTargetRef}
                className={`${billingTagetOverflowActived ? "rounded-tl-md" : "rounded-t-md"} bg-teal-600 relative text-3xl pb-1.5 text-center py-1 select-none font-medium border-b-2 border-gray-600`}
            >
                <h1>Aranceles <span className="text-white font-black text-xl">(Capítulo {chapterNum})</span></h1>
                {showResult === "good-practice" && (
                    <div className="absolute top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-emerald-400 transform animate-messagge-from-right">
                        <BsClipboardCheck className="text-black" size={26} />
                        <p className="ml-2 text-black font-semibold text-lg select-none">Práctica agregada exitosamente</p>
                    </div>
                )}
                {showResult === "good-delete-practice" && (
                    <div className="absolute top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-emerald-400 transform animate-messagge-from-right">
                        <TiDocumentDelete className="text-black" size={28} />
                        <p className="ml-1 text-black font-semibold text-lg select-none">La práctica a sido eliminada</p>
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
                        <p className="ml-1 text-black font-semibold text-lg select-none">No tienes prácticas cargadas</p>
                    </div>
                )}
                {showResult === "good-price-update" && (
                    <div className="absolute top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-emerald-400 transform animate-messagge-from-right">
                        <IoLogoUsd className="text-black" size={24} />
                        <p className="ml-1 text-black font-semibold text-lg select-none">El precio a sido actualizado</p>
                    </div>
                )}
            </div>
            <table className="w-full select-none">
                <thead>
                    <tr className="border-b-2 border-gray-600 bg-white select-none text-left text-xs font-semibold uppercase tracking-widest text-black">
                        <th className="flex justify-center py-3">Número</th>
                        <th className="pl-2 border-r-2 border-l-2 border-gray-600">Nombre de Práctica</th>
                        <th className="pl-5 py-3 w-56">Precio</th>
                        <th className="px-1 border-l-2 border-gray-600 py-3">Eliminar</th>
                    </tr>
                </thead>
                <tbody className="text-white">
                    {chapterData.map((practice: any, index: any) => (
                        <tr
                            key={index}
                            className={`${index === chapterData.length - 1 && billingTagetOverflowActived === false ? "border-b-2 border-gray-600" : ""} ${index !== chapterData.length - 1 ? "border-b-2 border-gray-600" : ""}`}
                        >
                            <td className="pl-4 px-4 whitespace-nowrap border-r-2 border-gray-600 w-16">
                                <div className="text-center text-white items-center justify-center flex rounded-full w-fit bg-teal-600 text-sm font-semibold">
                                    <p className="ml-1.5 mr-1.5">{formattedIdFromRoman(chapterNum)}.{practice.id}</p>
                                </div>
                            </td>
                            <td className="px-2 py-4 whitespace-normal text-black text-sm border-r-2 border-gray-600">
                                <p>{practice.name}</p>
                            </td>
                            {openPriceEdit[index] ? (
                                <td className="whitespace-nowrap w-auto text-black px-2 bg-teal-600 transition duration-150 hover:text-white">
                                    <div className="flex justify-between items-center">
                                        <div className="flex justify-center items-center">
                                            <IoLogoUsd size={24} className="text-black" />
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
                                                className="font-semibold w-52 my-4 mr-4 h-7 outline-none text-black bg-white rounded-md resize-none px-2 text-xl bg-transparent flex justify-end"
                                            />
                                        </div>
                                        <div className="flex">
                                            <FaRegCircleCheck size={28} onClick={() => handleUpdatePrice(practice.id)} className="mr-1 cursor-pointer hover:scale-125 transition duration-150 hover:text-white text-black" />
                                            <FaRegCircleXmark size={28} onClick={cancelEdit} className="ml-1 cursor-pointer hover:scale-125 transition duration-150 hover:text-white text-black" />
                                        </div>
                                    </div>
                                </td>
                            ) : (
                                <td onClick={() => togglePriceEdit(index)} className="px-5 whitespace-nowrap w-auto text-black group hover:bg-teal-600 py-4 cursor-pointer transition duration-150 hover:text-white">
                                    <div className="flex justify-between items-center">
                                        <p>${formatPrice(practice.price)}</p>
                                        <FaPen className="group-hover:text-white group-hover:duration-150 ml-2 text-black" />
                                    </div>
                                </td>
                            )}
                            <td
                                onClick={() => {
                                    setOpenAlert("delete");
                                    setId(practice.id);
                                    setPracticeName(practice.name);
                                    setPrice(formatPrice(practice.price));
                                }}
                                className="pl-6 whitespace-nowrap border-l-2 border-gray-600 w-6 text-black hover:bg-red-700 group cursor-pointer"
                            >
                                <button><MdDelete size={24} className="group-hover:scale-125 transform mt-2 ml-0.5 transition duration-150" /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}