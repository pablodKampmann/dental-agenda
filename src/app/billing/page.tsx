'use client'

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { auth } from "./../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Loading } from "./../components/loading";
import { getChapter } from "./../components/getChapter";
import { ClipLoader } from "react-spinners";
import { HiFolderAdd } from "react-icons/hi";
import { MdDelete } from "react-icons/md";
import { FaPen } from "react-icons/fa";
import { Alert } from "./../components/alert";
import { TiDocumentDelete } from "react-icons/ti";
import { BsClipboardCheck } from "react-icons/bs";
import { IoLogoUsd } from "react-icons/io5";
import { RiAlertFill } from "react-icons/ri";
import { FaRegCircleCheck, FaRegCircleXmark } from "react-icons/fa6";
import { updatePracticePrice } from "./../components/updatePracticePrice";
import { setPractice } from "./../components/setPractice";
import { ImCancelCircle } from "react-icons/im";
import { updateChapterPrices } from "./../components/updateChapterPrices";
import { PiSealWarningThin } from "react-icons/pi";
import { getUser } from "./../components/getUser";

export default function Page() {
    const router = useRouter()
    const [isLoad, setIsLoad] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [loadingIncreaseOrDecrease, setLoadingIncreaseOrDecrease] = useState(false);
    const [alreadyExists, setAlreadyExists] = useState(false);
    const [chapterName, setChapterName] = useState("CONSULTAS");
    const [chapterData, setChapterData] = useState<any>(null);
    const [chapterNum, setChapterNum] = useState<any>('');
    const [id, setId] = useState<any>(null);
    const [price, setPrice] = useState<any>(null);
    const [percentage, setPercentage] = useState<any>(null);
    const [percentageVisible, setPercentageVisible] = useState<any>(null);
    const [practiceName, setPracticeName] = useState<any>(null);
    const [isLoadData, setIsLoadData] = useState(true);
    const [openPriceEdit, setOpenPriceEdit] = useState(Array(chapterData?.length).fill(false));
    const [openCreatePractice, setOpenCreatePractice] = useState(false);
    const [openFormPercentages, setOpenFormPercentages] = useState(false);
    const [showResult, setShowResult] = useState<any>(null);
    const [openAlert, setOpenAlert] = useState('');
    const [billingTagetOverflowActived, setBillingTagetOverflowActived] = useState(false);
    const [newPrice, setNewPrice] = useState<any>(null);
    const billingTargetRef = useRef<any>(null);

    //CHECK IF THE USER IS LOGGED IN && GET USER
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                handleGetUser();
            } else if (!user) {
                router.push("/notSign");
            }
        });

        async function handleGetUser() {
            const user = await getUser();
            setUser(user);
            setIsLoad(false);
        }

        return () => unsubscribe();
    }, [router]);


    //CHAPTER

    useEffect(() => {
        setOpenPriceEdit(Array(chapterData?.length).fill(false));
        updatePractices();
    }, [chapterName]);

    function formattedIdFromRoman(numberInRoman: string) {
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

        const decimalValue = romanToDecimal(numberInRoman);
        const formattedDecimal = decimalValue < 10 ? `0${decimalValue}` : `${decimalValue}`;

        return formattedDecimal;
    }

    //PRACTICES

    async function updatePractices() {
        setIsLoadData(true);
        const { data, chapterNum } = await getChapter(chapterName)
        if (data && chapterNum) {
            const filteredData = data.filter(item => !Object.values(item).every(value => value === undefined));
            filteredData.sort((a, b) => {
                if (a.id && b.id) {
                    return parseInt(a.id) - parseInt(b.id);
                }
                return 0;
            });
            console.log(filteredData);

            setChapterData(filteredData);
            setChapterNum(chapterNum);
            setIsLoadData(false);
        }
    }

    //PERCENTAGES-FUNCTIONS

    async function handleIncreaseOrDecrease() {
        if (chapterData.length > 0) {
            setLoadingIncreaseOrDecrease(!loadingIncreaseOrDecrease);

            const updatedChapterData = chapterData.map((chapter: { price: number; }) => {
                const newPrice = (chapter.price + (chapter.price * percentage));
                const roundedPrice = Math.round(newPrice);
                return {
                    ...chapter,
                    price: roundedPrice
                };
            });

            const result = await updateChapterPrices(updatedChapterData, chapterName);
            if (result === 'error') {
                setLoadingIncreaseOrDecrease(false);
            } else {
                updatePractices();
                setOpenFormPercentages(false)
                setLoadingIncreaseOrDecrease(false)
                setShowResult('good-prices-update')
            }
        }
    }

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setAlreadyExists(false);
        }, 6000);

        return () => clearTimeout(timeoutId);
    }, [alreadyExists]);

    //POP-UP MESSAGES

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setShowResult(null);
        }, 6000);

        return () => clearTimeout(timeoutId);
    }, [showResult]);

    //USER-EXPERIENCE

    function formatPrice(price: number) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    useEffect(() => {
        setBillingTagetOverflowActived(false);
        if (isLoadData !== true) {
            const container = document.getElementById('billing-target');
            if (container && container.scrollHeight > container.clientHeight) {
                setBillingTagetOverflowActived(true);
            }
        }

    }, [isLoadData, chapterName]);

    useEffect(() => {
        if (billingTargetRef.current) {
            billingTargetRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [chapterData]);

    //PRICE-EDIT

    function togglePriceEdit(index: any) {
        cancelEdit();
        const newOpenPriceEdit = [...openPriceEdit];
        newOpenPriceEdit[index] = !newOpenPriceEdit[index];
        setOpenPriceEdit(newOpenPriceEdit);
    }

    function cancelEdit() {
        setOpenPriceEdit(Array(chapterData?.length).fill(false));
        setNewPrice(null);
    }

    async function handleUpdatePrice(practiceId: number) {
        if (newPrice !== null) {
            const priceFormatted = newPrice.replace(/\./g, '');
            const priceNumber = parseFloat(priceFormatted);
            const result = await updatePracticePrice(chapterName, practiceId, priceNumber);
            cancelEdit();
            if (result !== 'error') {
                updatePractices();
                setShowResult('good-price-update')
            }
        } else {
            cancelEdit();
        }
    }

    function handleKeyPress(event: any, practiceId: number) {
        if (event.key === 'Enter') {
            if (newPrice !== null) {
                handleUpdatePrice(practiceId);
            } else {
                cancelEdit();
            }
        } else if (event.key === 'Escape') {
            cancelEdit();
        }
    }

    async function HandleSubmit(e: any) {
        e.preventDefault();
        setLoading(true);
        const priceFormatted = price.replace(/\./g, '');
        const priceNumber = parseFloat(priceFormatted);
        const result = await setPractice(id, priceNumber, practiceName, chapterName);
        if (result !== 'error') {
            if (result === 'already-exists') {
                setLoading(false);
                setAlreadyExists(true);
            } else {
                setOpenCreatePractice(false);
                setId(null);
                setPrice(null);
                setPracticeName(null);
                setShowResult('good-practice');
                updatePractices();
            }
        }
    }

    return (
        <div className='ml-56  h-screen overflow-hidden flex-1'>
            {isLoad ? (
                <Loading />
            ) : (
                <div className='h-full py-2'>
                    {openAlert === 'delete' && (
                        <div className='absolute inset-0 backdrop-blur-sm ml-56 z-10'>
                            <Alert clinicId={user.clinicId} onCloseAlert={() => setOpenAlert('')} onSuccess={() => { setOpenAlert(''); updatePractices(); setShowResult('good-delete-practice') }} action={'Eliminar Práctica'} firstProp={'¿Estás seguro/a de que deseas elimanar esta práctica?'} secondProp={practiceName} thirdProp={price} fourthProp={id} fifthProp={chapterName} />
                        </div>
                    )}
                    <div className='ml-2 mr-2 p-4 mt-16'>
                        <div className='flex justify-between select-none'>
                            <div className='flex items-center '>
                                <select value={chapterName} onChange={(event) => { setChapterName(event.target.value); }}
                                    className='cursor-pointer hover:bg-teal-600 hover:border-gray-600 hover:text-white hover:border-y-2 border-x-2 border-x-gray-600 border-x-transparent transition duration-300 bg-gray-300 bg-opacity-30 w-80 h-10 outline-none text-black text-xl font-bold border-y-4 px-4  border-teal-600 rounded-3xl shadow-lg  flex justify-center items-center'>
                                    <option value={"CONSULTAS"} selected>CONSULTAS</option>
                                    <option value={"OPERATORIA DENTAL"} selected>OPERATORIA DENTAL</option>
                                    <option value={"ENDODONCIA"} selected>ENDODONCIA</option>
                                    <option value={"PRÓTESIS"} selected>PRÓTESIS</option>
                                    <option value={"ODONTOLOGÍA PREVENTIVA"} selected>ODONTOLOGÍA PREVENTIVA</option>
                                    <option value={"ORTODONCIA Y ORTOPEDIA FUNCIONAL"} selected>ORTODONCIA Y ORTOPEDIA FUNCIONAL</option>
                                    <option value={"ODONTOPEDIATRÍA"} selected>ODONTOPEDIATRÍA</option>
                                    <option value={"PERIODONCIA"} selected>PERIODONCIA</option>
                                    <option value={"RADIOLOGÍA"} selected>RADIOLOGÍA</option>
                                    <option value={"CIRUGÍA"} selected>CIRUGÍA</option>
                                </select>
                                {isLoadData && (
                                    <ClipLoader className='ml-4' />
                                )}
                            </div>
                            <button onClick={() => {
                                setOpenCreatePractice(!openCreatePractice); setId(null); setPrice(null); setOpenFormPercentages(false); setPracticeName(null); setLoading(false);
                            }} className="shadow-lg h-10 text-black bg-gray-300 bg-opacity-30 hover:bg-teal-600 hover:border-gray-600 hover:text-white text-xl font-semibold  px-4 border-b-4 border-2 border-b-teal-600 border-gray-600 rounded-lg flex items-center justify-center transition duration-200">
                                {openCreatePractice ? (
                                    <div className='flex justify-center items-center'>
                                        <ImCancelCircle className="mr-2" size={24} />Cancelar
                                    </div>
                                ) : (
                                    <div className='flex justify-center items-center'>
                                        <HiFolderAdd className="mr-2" size={28} />Agregar Práctica
                                    </div>
                                )}
                            </button>
                        </div>
                    </div>
                    {chapterData ? (
                        <div className='flex justify-between h-screen pb-44 mt-2 overflow-y-hidden w-full'>
                            <div id="billing-target" className='mx-6 mr-8 rounded-lg w-full h-full border-2 border-gray-600 flex-1 overflow-y-auto bg-gray-300 bg-opacity-30 overflow-x-hidden shadow-lg'>
                                <div ref={billingTargetRef} className={`${billingTagetOverflowActived ? 'rounded-tl-md' : 'rounded-t-md '} bg-teal-600  relative text-3xl pb-1.5 text-center py-1 select-none font-medium border-b-2 border-gray-600`}>
                                    <h1 >Aranceles </h1>
                                    {showResult === 'good-practice' && (
                                        <div className="absolute top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-emerald-400 transform animate-messagge-from-right ">
                                            <div className='flex justify-start items-center'>
                                                <BsClipboardCheck className='text-black' size={26} />
                                                <p className='ml-2 text-black font-semibold text-lg select-none'>Práctica agregada exitosamente</p>
                                            </div>
                                        </div>
                                    )}
                                    {showResult === 'good-delete-practice' && (
                                        <div className="absolute transition-width top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-emerald-400  transform animate-messagge-from-right">
                                            <div className='flex justify-start items-center'>
                                                <TiDocumentDelete className='text-black' size={28} />
                                                <p className='ml-1 text-black font-semibold text-lg select-none'>La práctica a sido eliminada</p>
                                            </div>
                                        </div>
                                    )}
                                    {showResult === 'good-prices-update' && (
                                        <div className="absolute transition-width top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-emerald-400  transform animate-messagge-from-right">
                                            <div className='flex justify-start items-center'>
                                                <IoLogoUsd className='text-black' size={24} />
                                                <p className='ml-1 text-black font-semibold text-lg select-none'>Los precios han sido actualizados</p>
                                            </div>
                                        </div>
                                    )}
                                    {showResult === 'no-practices' && (
                                        <div className="absolute transition-width top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-red-500  transform animate-messagge-from-right">
                                            <div className='flex justify-start items-center'>
                                                <RiAlertFill className='text-black' size={24} />
                                                <p className='ml-1 text-black font-semibold text-lg select-none'>No tienes practícas cargadas</p>
                                            </div>
                                        </div>
                                    )}
                                    {showResult === 'good-price-update' && (
                                        <div className="absolute transition-width  top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-emerald-400  transform animate-messagge-from-right">
                                            <div className='flex justify-start items-center'>
                                                <IoLogoUsd className='text-black' size={24} />
                                                <p className='ml-1 text-black font-semibold text-lg select-none'>El precio a sido actualizado</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <table className="w-full select-none  ">
                                    <thead>
                                        <tr className='border-b-2 border-gray-600 bg-white select-none text-left text-xs font-semibold uppercase tracking-widest text-black'>
                                            <th className="flex justify-center py-3">Número</th>
                                            <th className="pl-2 border-r-2 border-l-2 border-gray-600 ">Nombre de Práctica</th>
                                            <th className="pl-5 py-3 w-56">Precio</th>
                                            <th className=" px-1 border-l-2 border-gray-600 py-3">Eliminar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-white ">
                                        {chapterData.map((practice: any, index: any) => (
                                            <tr key={index} className={`${index === chapterData.length - 1 && billingTagetOverflowActived === false ? 'border-b-2 border-gray-600' : ''} ${index !== chapterData.length - 1 ? 'border-b-2 border-gray-600' : ''}`}>
                                                <td className="pl-4 px-4   whitespace-nowrap border-r-2 border-gray-600 w-16">
                                                    <div className="text-center  text-white items-center justify-center flex rounded-full w-fit bg-teal-600 text-sm font-semibold">
                                                        <p className='ml-1.5 mr-1.5'>{formattedIdFromRoman(chapterNum)}.{practice.id}</p>
                                                    </div>
                                                </td>
                                                <td className="px-2 py-4 whitespace-normal text-black text-sm border-r-2 border-gray-600">
                                                    <p>{practice.name}</p>
                                                </td>
                                                {openPriceEdit[index] ? (
                                                    <td className=" whitespace-nowrap w-auto text-black px-2 bg-teal-600 transition duration-150 hover:text-white">
                                                        <div className='flex justify-between items-center'>
                                                            <div className='flex justify-center items-center'>
                                                                <IoLogoUsd size={24} className="text-black" />
                                                                <input
                                                                    defaultValue={formatPrice(practice.price)}
                                                                    value={newPrice}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value.replace(/\D/g, '');
                                                                        const formattedValue = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                                                                        setNewPrice(formattedValue);
                                                                    }}
                                                                    type='text'
                                                                    autoFocus
                                                                    onKeyDown={(event) => handleKeyPress(event, practice.id)}
                                                                    className='font-semibold w-52 my-4 mr-4 h-7 outline-none text-black bg-white rounded-md resize-none px-2 text-xl bg-transparent flex justify-end'>
                                                                </input>
                                                            </div>
                                                            <div className='flex'>
                                                                <FaRegCircleCheck size={28} onClick={() => handleUpdatePrice(practice.id)} className=" mr-1 cursor-pointer hover:scale-125 transition duration-150 hover:text-white  text-black " />
                                                                <FaRegCircleXmark size={28} onClick={cancelEdit} className=" ml-1 cursor-pointer hover:scale-125 transition duration-150 hover:text-white  text-black " />
                                                            </div>
                                                        </div>
                                                    </td>
                                                ) : (
                                                    <td onClick={() => togglePriceEdit(index)} className="px-5 whitespace-nowrap w-auto  text-black group  hover:bg-teal-600 py-4 cursor-pointer transition duration-150 hover:text-white">
                                                        <div className='flex justify-between items-center'>
                                                            <p>${formatPrice(practice.price)}</p>
                                                            <FaPen className="group-hover:text-white group-hover:duration-150 ml-2  text-black " />
                                                        </div>
                                                    </td>
                                                )}
                                                <td onClick={() => { setOpenAlert('delete'); setId(practice.id); setPracticeName(practice.name); setPrice(formatPrice(practice.price)) }} className=" pl-6 whitespace-nowrap border-l-2 border-gray-600 w-6 text-black hover:bg-red-700 group cursor-pointer">
                                                    <button><MdDelete size={24} className="group-hover:scale-125 transform mt-2 ml-0.5 transition duration-150" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {openCreatePractice ? (
                                <div className='overflow-hidden'>
                                    <form onSubmit={HandleSubmit} className="relative w-[400px] mr-6 animate-move-from-right-form">
                                        <div className="w-full border-2 border-gray-600 relative  bg-gray-300 bg-opacity-30 shadow-lg rounded-lg ">
                                            <div className="flex-col items-center ">
                                                <h1 className='bg-teal-600 rounded-t-md py-1 px-2 text-center text-3xl select-none font-medium border-b-2 border-gray-600'>Agregar Práctica</h1>
                                                <div className='flex py-4 px-4'>
                                                    <div className="select-none h-12 w-12 bg-teal-600 rounded-full flex items-center justify-center text-teal-950 text-3xl font-mono">i</div>
                                                    <div className="block font-semibold text-xl text-black ml-3">
                                                        <h2 className="text-2xl font-light leading-tight select-none">Capítulo {chapterNum} ({chapterName})</h2>
                                                        <p className="text-sm  font-light leading-tight select-none">Por favor, completa los datos del formulario.</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className=" pb-4 px-4">
                                                <div className='flex justify-between '>
                                                    <div className="flex flex-col mt-1 w-36 mx-2">
                                                        <div className='flex select-none'>
                                                            <label className="text-black select-none text-lg ">Núm.</label>
                                                            {alreadyExists && (
                                                                <div className='animate-alredy-exists bg-red-500  rounded-lg px-1 text-xs text-center flex h-6 items-center'>
                                                                    Ocupado
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className='flex justify-center items-center'>
                                                            <p className='text-black  bg-teal-600 rounded-l-md py-1.5 px-2 font-semibold text-lg select-none'>
                                                                {formattedIdFromRoman(chapterNum)}.
                                                            </p>
                                                            <div className="relative text-gray-400 ">
                                                                <input
                                                                    placeholder='08'
                                                                    type="text"
                                                                    className={`${alreadyExists ? 'bg-red-500 bg-opacity-70' : 'bg-white'} h-10 px-3  select-none py-2 w-16 border focus:ring-gray-500 focus:border-gray-600 text-md font-bold border-gray-300 rounded-r-md focus:outline-none  text-black `}
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
                                                                    className="h-10 px-3 py-2 w-full border focus:ring-gray-500  select-none focus:border-gray-600 text-md font-bold border-gray-300 rounded-r-md focus:outline-none bg-white text-black"
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
                                                <div className="flex flex-col mt-2 w-full pr-4 mx-2">
                                                    <div className='flex'>
                                                        <label className="text-black select-none text-lg ml-1">Nombre de práctica</label>
                                                    </div>
                                                    <div className="relative text-gray-400 ">
                                                        <input
                                                            type="text"
                                                            className="h-10 px-3 py-2 w-full border focus:ring-gray-500 focus:border-gray-600 text-sm border-gray-300 rounded-md focus:outline-none bg-white text-black"
                                                            required
                                                            name='lastName'
                                                            value={practiceName}
                                                            onChange={(e) => setPracticeName(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-2 px-4 pb-4 flex justify-center items-center select-none text-base">
                                                <button type="button" onClick={() => setOpenCreatePractice(false)} className="bg-red-900 hover:text-lg h-12 hover:bg-red-800 font-semibold flex justify-center items-center w-full text-red-200 hover:text-white mx-2  rounded-md focus:outline-none transition duration-200">CANCELAR</button>
                                                <button type="submit" className="bg-teal-600 hover:bg-teal-500 font-semibold hover:text-lg flex justify-center h-12  items-center w-full text-teal-950 hover:text-white mx-2 rounded-md focus:outline-none transition duration-200">
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
                                </div>
                            ) : (
                                <div className='overflow-hidden  w-1/5'>
                                    <div className={`${openFormPercentages ? 'h-fit' : 'h-fit'} animate-move-from-right-form transition-all text-black border-2 duration-500 ease border-gray-600 ml-auto mr-6 shadow-lg rounded-lg  select-none bg-gray-300 bg-opacity-30`}>
                                        {openFormPercentages ? (
                                            <div className=' flex  p-4 pt-6 flex-col justify-center items-center'>
                                                <PiSealWarningThin className="text-gray-600" size={80} />
                                                {percentage > 0 ? (
                                                    <h1 className='text-md px-1 tracking-wide mt-1 text-center'>¿Estás seguro/a de que deseas aumentar un <span className='font-semibold'>{percentageVisible}</span> el valor de todas las prácticas del capítulo?</h1>
                                                ) : (
                                                    <h1 className='text-md px-1 tracking-wide mt-1 text-center'>¿Estás seguro/a de que deseas disminuir un <span className='font-semibold'>{percentageVisible}</span> el valor de todas las prácticas del capítulo?</h1>
                                                )}
                                                <div className='flex mt-16 text-xl font-medium w-full'>
                                                    <button onClick={() => setOpenFormPercentages(false)} className='mr-1.5 py-1 bg-red-600 hover:bg-opacity-70 hover:transition hover:duration-250 hover:text-gray-100 text-red-900 bg-opacity-50 rounded-lg w-full shadow-lg'>NO</button>
                                                    <button onClick={handleIncreaseOrDecrease} className='ml-1.5 py-1 bg-teal-600 hover:bg-opacity-70 hover:transition hover:duration-200 hover:text-gray-100 text-teal-900 bg-opacity-50 rounded-lg w-full shadow-lg'>
                                                        {loadingIncreaseOrDecrease ? (
                                                            <div className='flex justify-center items-center py-0.5'>
                                                                <ClipLoader color="white" size={20} />
                                                            </div>
                                                        ) : (
                                                            "SI"
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <h1 className='flex justify-center items-center bg-teal-600 px-1 text-center  text-white font-semibold text-xl py-2 border-b-2 border-gray-600 rounded-t-md'>AUMENTAR TODO</h1>
                                                <div className='flex font-medium transition'>
                                                    <button onClick={() => { setPercentageVisible('+5%'); setPercentage(0.05); setOpenFormPercentages(true); }} className='hover:bg-teal-600 w-1/2 hover:duration-150 border-r-2 py-2 border-b-2 border-gray-600'>+5%</button>
                                                    <button onClick={() => { setPercentageVisible('+10%'); setPercentage(0.1); setOpenFormPercentages(true); }} className='hover:bg-teal-600 w-1/2 hover:duration-150 border-b-2 py-2 border-gray-600'>+10%</button>
                                                </div>
                                                <div className='flex font-medium transition'>
                                                    <button onClick={() => { setPercentageVisible('+15%'); setPercentage(0.15); setOpenFormPercentages(true); }} className='hover:bg-teal-600 w-1/2 hover:duration-150 border-r-2 py-2 border-b-2 border-gray-600'>+15%</button>
                                                    <button onClick={() => { setPercentageVisible('+20%'); setPercentage(0.2); setOpenFormPercentages(true); }} className='hover:bg-teal-600 w-1/2 hover:duration-150 border-b-2 py-2 border-gray-600'>+20%</button>
                                                </div>
                                                <h1 className='flex justify-center items-center bg-teal-600 text-center px-1  text-white font-semibold text-xl py-2 border-b-2 border-gray-600'>DISMINUIR TODO</h1>
                                                <div className='flex font-medium transition'>
                                                    <button onClick={() => { setPercentageVisible('-5%'); setPercentage(-0.05); setOpenFormPercentages(true); }} className='hover:bg-red-800 w-1/2 hover:duration-150 border-r-2 py-2 border-b-2 border-gray-600'>-5%</button>
                                                    <button onClick={() => { setPercentageVisible('-10%'); setPercentage(-0.1); setOpenFormPercentages(true); }} className='hover:bg-red-800 w-1/2 hover:duration-150 border-b-2 py-2 border-gray-600'>-10%</button>
                                                </div>
                                                <div className='flex font-medium transition'>
                                                    <button onClick={() => { setPercentageVisible('-15%'); setPercentage(-0.15); setOpenFormPercentages(true); }} className='hover:bg-red-800 w-1/2 hover:duration-150 border-r-2 py-2 rounded-bl-md border-gray-600'>-15%</button>
                                                    <button onClick={() => { setPercentageVisible('-20%'); setPercentage(-0.2); setOpenFormPercentages(true); }} className='hover:bg-red-800 w-1/2  hover:duration-150 py-2 rounded-br-md border-gray-600'>-20%</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) :
                        null
                    }
                </div >
            )
            }
        </div >
    )
}
