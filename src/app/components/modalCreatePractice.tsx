import React, { useState, useEffect } from 'react';
import { setPractice } from "./../components/setPractice";
import { ClipLoader } from "react-spinners";

interface ModalSettProps {
    onCloseModal: () => void;
    onSuccess: () => void;
    chapter: string | '';
}

export function ModalCreatePractice({ onCloseModal, onSuccess, chapter }: ModalSettProps) {
    const [id, setId] = useState<any>(null);
    const [price, setPrice] = useState<any>(null);
    const [practiceName, setPracticeName] = useState("");
    const [loading, setLoading] = useState(false);
    const [alreadyExists, setAlreadyExists] = useState(false);
    const [chapterFormatted, setChapterFormatted] = useState('');
    const [idChapter, setIdChapter] = useState<any>(null);

    async function HandleSubmit(e: any) {
        e.preventDefault();
        setLoading(true);
        const priceFormatted = price.replace(/\./g, '');
        const priceNumber = parseFloat(priceFormatted);
        const result = await setPractice(id, priceNumber, practiceName, chapter);
        if (result !== 'error') {
            if (result === 'already-exists') {
                setLoading(false);
                setAlreadyExists(true);
            } else {
                onCloseModal();
                onSuccess();
            }
        }
    }

    function HandleCloseModal() {
        onCloseModal();
    }

    useEffect(() => {
        const romanToDecimal = (roman: string) => {
            const romanNumeralMap: Record<string, number> = {
                'I': 1,
                'V': 5,
                'X': 10,
                'L': 50,
                'C': 100,
                'D': 500,
                'M': 1000
            };
            let decimal = 0;
            for (let i = 0; i < roman.length; i++) {
                const currentCharValue = romanNumeralMap[roman[i]];
                const nextCharValue = romanNumeralMap[roman[i + 1]];
                if (nextCharValue && currentCharValue < nextCharValue) {
                    decimal += nextCharValue - currentCharValue;
                    i++;
                } else {
                    decimal += currentCharValue;
                }
            }
            return decimal;
        };

        const capitalizeFirstLetter = (string: string) => {
            return string.charAt(0).toUpperCase() + string.slice(1);
        };

        if (chapter) {
            const translatedChapter = "Capítulo";
            const chapterNumberMatch = chapter.match(/\d+$/);
            const chapterNumber = chapterNumberMatch ? chapterNumberMatch[0] : '';
            const restOfChapter = chapter.replace(/^chapter/i, '');
            const chapterFormatted = `${translatedChapter} ${capitalizeFirstLetter(chapterNumber)}${restOfChapter}`;
            setChapterFormatted(chapterFormatted);
            const idChapter = romanToDecimal(restOfChapter);
            const formattedIdChapter = idChapter < 10 ? `0${idChapter}` : idChapter;
            setIdChapter(formattedIdChapter)
        }
    }, [chapter]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setAlreadyExists(false);
        }, 6000);

        return () => clearTimeout(timeoutId);
    }, [alreadyExists]);

    return (
        <div className="fixed inset-0 flex items-center justify-center mt-12">
            <form onSubmit={HandleSubmit} className="relative py-2 w-[550px] ">
                <div className="w-full border-4 border-gray-600 relative px-4 py-4 bg-white shadow-xl rounded-xl ">
                    <div className="flex items-center ">
                        <div className="select-none h-16 w-16 bg-teal-600 rounded-full flex items-center justify-center text-teal-950 text-4xl font-mono">i</div>
                        <div className="block font-semibold text-xl text-black ml-3">
                            <h2 className="text-2xl leading-tight select-none">Agregar Práctica</h2>
                            <h2 className="text-2xl leading-tight select-none">{chapterFormatted}</h2>

                            <p className="text-sm  font-normal leading-tight select-none">Por favor, completa los datos del formulario.</p>
                        </div>
                    </div>
                    <div className="pt-2 pb-4">
                        <div className='flex justify-between '>
                            <div className="flex flex-col mt-1 w-1/3 mx-2">
                                <div className='flex select-none'>
                                    <label className="text-black select-none text-lg ml-2">Id</label>
                                    {alreadyExists && (
                                        <div className='animate-alredy-exists bg-red-500 ml-6 rounded-lg px-1 text-sm text-center flex h-6 items-center'>
                                            Ocupado
                                        </div>
                                    )}
                                </div>
                                <div className='flex justify-center items-center'>
                                    <p className='text-black ml-1 bg-teal-600 rounded-l-md py-1.5 px-2 font-semibold text-lg select-none'>
                                        {idChapter}.
                                    </p>
                                    <div className="relative text-gray-400 ">
                                        <input
                                            placeholder='08'
                                            type="text"
                                            className={`${alreadyExists ? 'bg-red-500 bg-opacity-70' : ''} h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-md font-bold border-gray-300 rounded-r-md focus:outline-none bg-gray-300 bg-opacity-30 text-black `}
                                            required
                                            name='id'
                                            value={id}
                                            onChange={(e) => setId(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col mt-1 w-full mx-2">
                                <div className='flex'>
                                    <label className="text-black select-none text-lg ml-2">Precio</label>
                                </div>
                                <div className='flex justify-center items-center'>
                                    <p className='text-black ml-1 bg-teal-600 rounded-l-md py-1.5 px-2 font-semibold text-lg select-none'>
                                        $
                                    </p>
                                    <div className="relative text-gray-400 w-full ">
                                        <input
                                            placeholder='56.235'
                                            type="text"
                                            className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-md font-bold border-gray-300 rounded-r-md focus:outline-none bg-gray-300 bg-opacity-30 text-black"
                                            required
                                            name='price'
                                            value={price}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/\D/g, '');
                                                const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                                                setPrice(formattedValue);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col mt-2 w-full pr-4 pl-1 mx-2">
                            <div className='flex'>
                                <label className="text-black select-none text-lg ml-1">Nombre de práctica</label>
                            </div>
                            <div className="relative text-gray-400 ">
                                <input
                                    type="text"
                                    className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-gray-300 bg-opacity-30 text-black"
                                    required
                                    name='lastName'
                                    value={practiceName}
                                    onChange={(e) => setPracticeName(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="pt-3 flex items-center space-x-3 select-none">
                        <button type="button" onClick={HandleCloseModal} className="bg-red-900 hover:bg-red-800 font-semibold flex justify-center items-center w-full text-red-200 hover:text-white px-4 py-3 rounded-md focus:outline-none transition duration-200">CANCELAR</button>
                        <button type="submit" className="bg-teal-600 hover:bg-teal-500 font-semibold flex justify-center items-center w-full text-teal-950 hover:text-white px-4 py-3 rounded-md focus:outline-none transition duration-200">
                            {loading ? (
                                <div className='flex justify-center items-center '>
                                    <ClipLoader className='' color="white" size={24} />
                                </div>
                            ) : (
                                'CREAR'
                            )}
                        </button>
                    </div>
                </div >
            </form >
        </div >
    );
}
