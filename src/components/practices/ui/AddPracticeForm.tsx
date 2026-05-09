import React, { useState } from 'react';
import { ClipLoader } from "react-spinners";

interface Props {
    chapterName: string;
    price: string;
    setPrice: (value: string) => void;
    practiceName: string;
    setPracticeName: (value: string) => void;
    loading: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export function AddPracticeForm({ chapterName, price, setPrice,
    practiceName, setPracticeName, loading, onSubmit, onCancel
}: Props) {
    const [nameError, setNameError] = useState('');
    const [priceError, setPriceError] = useState('');

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        let valid = true;

        if (!practiceName || !practiceName.trim()) {
            setNameError('El nombre no puede estar vacío');
            valid = false;
        } else {
            setNameError('');
        }

        const priceNum = price ? parseFloat(price.replace(/\./g, '')) : 0;
        if (!price || priceNum <= 0) {
            setPriceError('El precio debe ser mayor a $0');
            valid = false;
        } else {
            setPriceError('');
        }

        if (valid) {
            setPracticeName(practiceName.trim());
            onSubmit(e);
        }
    }

    return (
        <div className="overflow-hidden">
            <form onSubmit={handleSubmit} className="relative w-[340px] mr-6 animate-move-from-right-form">
                <div className="w-full border-2 border-gray-600 bg-gray-300 bg-opacity-30 shadow-lg rounded-lg">

                    {/* Header */}
                    <h1 className="bg-teal-600 rounded-t-md py-2 text-center text-2xl select-none font-medium border-b-2 border-gray-600">
                        Agregar Práctica
                    </h1>

                    {/* Info row */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b-2 border-gray-600 bg-white bg-opacity-40">
                        <div className="select-none w-9 h-9 flex-shrink-0 bg-teal-600 rounded-full flex items-center justify-center text-white text-lg font-mono">
                            i
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 leading-tight">La práctica se agregará al capítulo <span className="font-semibold text-teal-700">{chapterName}</span></p>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="px-4 pt-4 pb-2 flex flex-col gap-4">

                        {/* Nombre */}
                        <div className="flex flex-col gap-1">
                            <label className="text-black text-sm font-semibold select-none">Nombre de práctica</label>
                            <input
                                type="text"
                                placeholder="Ej: Extracción simple"
                                className={`h-10 px-3 w-full border-2 rounded-md focus:outline-none bg-white text-black text-sm transition duration-150 ${nameError ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-teal-500'}`}
                                value={practiceName ?? ''}
                                onChange={(e) => { setPracticeName(e.target.value); if (nameError) setNameError(''); }}
                            />
                            {nameError && <p className="text-red-500 text-xs">{nameError}</p>}
                        </div>

                        {/* Precio */}
                        <div className="flex flex-col gap-1">
                            <label className="text-black text-sm font-semibold select-none">Precio</label>
                            <div className="flex">
                                <span className="flex items-center justify-center bg-teal-600 text-white font-bold px-3 rounded-l-md border-2 border-teal-600 text-sm select-none">
                                    $
                                </span>
                                <input
                                    placeholder="56.235"
                                    type="text"
                                    className={`h-10 px-3 flex-1 border-2 border-l-0 rounded-r-md focus:outline-none bg-white text-black font-semibold text-sm transition duration-150 ${priceError ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-teal-500'}`}
                                    value={price ?? ''}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        setPrice(value.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
                                        if (priceError) setPriceError('');
                                    }}
                                />
                            </div>
                            {priceError && <p className="text-red-500 text-xs">{priceError}</p>}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="px-4 pb-4 pt-2 flex gap-2">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 h-10 border-2 border-gray-600 rounded-md font-semibold text-black hover:bg-gray-200 transition duration-150 text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 h-10 bg-teal-600 border-2 border-gray-600 rounded-md font-semibold text-white hover:bg-teal-500 transition duration-150 text-sm flex items-center justify-center"
                        >
                            {loading ? <ClipLoader color="white" size={18} /> : 'Crear práctica'}
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
}
