import React from 'react';
import { ClipLoader } from "react-spinners";

interface Props {
    chapterName: string;
    price: any;
    setPrice: (value: any) => void;
    practiceName: any;
    setPracticeName: (value: any) => void;
    loading: boolean;
    onSubmit: (e: any) => void;
    onCancel: () => void;
}

export function AddPracticeForm({ chapterName, price, setPrice,
    practiceName, setPracticeName, loading, onSubmit, onCancel
}: Props) {
    return (
        <div className="overflow-hidden">
            <form onSubmit={onSubmit} className="relative w-[400px] mr-6 animate-move-from-right-form">
                <div className="w-full border-2 border-gray-600 relative bg-gray-300 bg-opacity-30 shadow-lg rounded-lg">
                    <div className="flex-col items-center">
                        <h1 className="bg-teal-600 rounded-t-md py-1 px-2 text-center text-3xl select-none font-medium border-b-2 border-gray-600">
                            Agregar Práctica
                        </h1>
                        <div className="flex py-4 px-4">
                            <div className="select-none h-12 w-12 bg-teal-600 rounded-full flex items-center justify-center text-teal-950 text-3xl font-mono">i</div>
                            <div className="block font-semibold text-xl text-black ml-3">
                                <h2 className="text-2xl font-light leading-tight select-none">{chapterName}</h2>
                                <p className="text-sm font-light leading-tight select-none">Por favor, completa los datos del formulario.</p>
                            </div>
                        </div>
                    </div>
                    <div className="pb-4 px-4">
                        <div className="flex justify-between">
                            <div className="flex flex-col mt-1 w-full mx-2">
                                <label className="text-black select-none text-lg ml-2">Precio</label>
                                <div className="flex justify-center items-center">
                                    <p className="text-black ml-1 bg-teal-600 rounded-l-md py-1.5 px-2 font-semibold text-lg select-none">$</p>
                                    <input
                                        placeholder="56.235"
                                        type="text"
                                        className="h-10 px-3 py-2 w-full border focus:ring-gray-500 select-none focus:border-gray-600 text-md font-bold border-gray-300 rounded-r-md focus:outline-none bg-white text-black"
                                        required
                                        value={price}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, "");
                                            setPrice(value.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col mt-2 w-full pr-4 mx-2">
                            <label className="text-black select-none text-lg ml-1">Nombre de práctica</label>
                            <input
                                type="text"
                                className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-white text-black"
                                required
                                value={practiceName}
                                onChange={(e) => setPracticeName(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="mt-2 px-4 pb-4 flex justify-center items-center select-none text-base">
                        <button type="button" onClick={onCancel} className="bg-red-900 hover:text-lg h-12 hover:bg-red-800 font-semibold flex justify-center items-center w-full text-red-200 hover:text-white mx-2 rounded-md focus:outline-none transition duration-200">
                            CANCELAR
                        </button>
                        <button type="submit" className="bg-teal-600 hover:bg-teal-500 font-semibold hover:text-lg flex justify-center h-12 items-center w-full text-teal-950 hover:text-white mx-2 rounded-md focus:outline-none transition duration-200">
                            {loading ? <ClipLoader color="white" size={24} /> : "CREAR"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
