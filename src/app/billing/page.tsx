'use client'

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import { auth } from "./../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FaTooth } from "react-icons/fa";
import { getChapter } from "./../components/getChapter";
import { ClipLoader } from "react-spinners";
import { HiFolderAdd } from "react-icons/hi";
import { MdDelete } from "react-icons/md";
import { FaPen } from "react-icons/fa";
import { ModalCreatePractice } from "./../components/modalCreatePractice";
import { Alert } from "./../components/alert";
import { TiDocumentDelete } from "react-icons/ti";
import { BsClipboardCheck } from "react-icons/bs";
import { IoLogoUsd } from "react-icons/io5";
import { RiAlertFill } from "react-icons/ri";

export default function Page() {
    const router = useRouter()
    const [isLoad, setIsLoad] = useState(true);
    const [chapter, setChapter] = useState("chapterI");
    const [chapterData, setChapterData] = useState<any>(null);
    const [title, setTitle] = useState<string>('');
    const [id, setId] = useState<any>(null);
    const [price, setPrice] = useState<any>(null);
    const [percentage, setPercentage] = useState<any>(null);
    const [percentageVisible, setPercentageVisible] = useState<any>(null);
    const [practiceName, setPracticeName] = useState<any>(null);
    const [isLoadData, setIsLoadData] = useState(true);
    const [openPriceEdit, setOpenPriceEdit] = useState(false);
    const [openModalCreatePractice, setOpenModalCreatePractice] = useState(false);
    const [showResult, setShowResult] = useState<any>(null);
    const [openAlert, setOpenAlert] = useState('');

    //CHECK IF THE USER IS LOGGED IN
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setIsLoad(false);
            } else if (!user) {
                router.push("/notSign");
            }
        });

        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        async function get() {
            const { data, practice } = await getChapter(chapter)
            if (data && practice) {
                const filteredData = data.filter(item => !Object.values(item).every(value => value === undefined));
                setChapterData(filteredData);
                setTitle(practice);
                if (data && practice) {
                    setIsLoadData(false);
                }
            }
        }

        get();
    }, [chapter]);

    function setFormattedPrice(price: number) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    async function updatePractices() {
        setIsLoadData(true);
        const { data, practice } = await getChapter(chapter)
        if (data && practice) {
            const filteredData = data.filter(item => !Object.values(item).every(value => value === undefined));
            setChapterData(filteredData);
            setTitle(practice);
            if (data && practice) {
                setIsLoadData(false);
            }
        }
    }

    function handleIncreaseOrDecrease(percentage: number, percentageVisible: string) {
        if (chapterData.length > 0) {
            setOpenAlert('increaseOrDecrease');
            setPercentage(percentage);
            setPercentageVisible(percentageVisible);
        } else {
            setShowResult('no-practices')
        }
    }

    //POP-UP MESSAGES
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setShowResult(null);
        }, 6000);

        return () => clearTimeout(timeoutId);
    }, [showResult]);

    return (
        <div className='ml-56 h-screen overflow-hidden flex-1  ' >
            {isLoad ? (
                <div className='fixed inset-0 backdrop-blur-sm ml-56'>
                    <div className='fixed inset-0 flex items-center justify-center'>
                        <div className='bg-teal-900 py-10 px-10 rounded-full shadow-xl animate-spin'>
                            <FaTooth size={100} />
                        </div>
                    </div>
                </div>
            ) : (
                <div className='overflow-hidden mt-2'>
                    {openModalCreatePractice && (
                        <div className="fixed inset-0 backdrop-blur-sm ml-56 z-10">
                            <ModalCreatePractice chapter={chapter} onCloseModal={() => setOpenModalCreatePractice(false)} onSuccess={() => { setShowResult('good-practice'); updatePractices() }} />
                        </div>
                    )}
                    {openAlert === 'delete' && (
                        <div className='absolute inset-0 backdrop-blur-sm ml-56 z-10'>
                            <Alert chapterData={null} id={id} appointment={null} chapter={chapter} firstMessage={'¿Estás seguro/a de que deseas elimanar esta práctica?'} secondMessage={practiceName} thirdMessage={price} action={'Eliminar Práctica'} onCloseModal={() => setOpenAlert('')} onSuccess={() => { updatePractices(); setShowResult('good-delete-practice') }} />
                        </div>
                    )}
                    {openAlert === 'increaseOrDecrease' && (
                        <div className='absolute inset-0 backdrop-blur-sm ml-56 z-10'>
                            {percentage > 0 ? (
                                <Alert chapterData={chapterData} id={percentage} appointment={null} chapter={chapter} firstMessage={'¿Estás seguro/a de que deseas aumentar un'} secondMessage={percentageVisible} thirdMessage={null} action={'AumentarDisminuir'} onCloseModal={() => setOpenAlert('')} onSuccess={() => { updatePractices(); setShowResult('good-prices-update') }} />
                            ) : (
                                <Alert chapterData={chapterData} id={percentage} appointment={null} chapter={chapter} firstMessage={'¿Estás seguro/a de que deseas disminuir un'} secondMessage={percentageVisible} thirdMessage={null} action={'AumentarDisminuir'} onCloseModal={() => setOpenAlert('')} onSuccess={() => { updatePractices(); setShowResult('good-prices-update') }} />
                            )}
                        </div>
                    )}
                    <div className='ml-2 mr-2 p-4 mt-16'>
                        <div className='flex justify-between select-none'>
                            <div className='flex'>
                                <div className='flex items-center '>
                                    <select value={chapter} onChange={(event) => { setChapter(event.target.value); setIsLoadData(true) }}
                                        className='focus:border-teal-600 bg-white cursor-pointer text-lg font-semibold shadow-xl outline-none bg-opacity-30 border-2 uppercase text-black border-gray-600 w-40 py-1.5 rounded-lg'>
                                        <option value={"chapterI"} selected>Capitulo I</option>
                                        <option value={"chapterII"} selected>Capitulo II</option>
                                        <option value={"chapterIII"} selected>Capitulo III</option>
                                    </select>
                                    <h1 className='text-black text-xl ml-1 font-bold'>:</h1>
                                    <h1 className='bg-gray-300 bg-opacity-30 text-black uppercase ml-4 text-xl font-bold border-t-4 px-4 border-b-4 border-teal-600 rounded-2xl shadow-lg h-12 flex justify-center items-center'>{title}</h1>
                                    {isLoadData && (
                                        <ClipLoader className='ml-4' />
                                    )}
                                </div>
                            </div>
                            <button onClick={() => setOpenModalCreatePractice(true)} className='hover:bg-teal-600 hover:text-white hover:border-b-gray-600 transition duration-150 text-black cursor-pointer text-lg bg-gray-400 bg-opacity-30 border-2 border-gray-600 px-4 font-medium rounded-xl shadow-md border-b-4 border-b-teal-600 flex justify-center items-center'><HiFolderAdd size={30} className="flex justify-center items-center mr-2" /> Agregar Práctica</button>
                        </div>
                    </div>
                    {chapterData ? (
                        <div className='flex justify-between'>
                            <div className='mx-6 h-fit rounded-lg w-full border-2 border-gray-600'>
                                <div className='bg-teal-600 rounded-t-md relative text-3xl pb-1.5 text-center py-1 select-none font-medium border-b-2 border-gray-600'>
                                    <h1 >Aranceles </h1>
                                    {showResult === 'good-practice' && (
                                        <div className="absolute shadow-xl top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-emerald-400 transform animate-messagge-from-right ">
                                            <div className='flex justify-start items-center'>
                                                <BsClipboardCheck className='text-black' size={26} />
                                                <p className='ml-2 text-black font-semibold text-lg select-none'>Práctica agregada exitosamente</p>
                                            </div>
                                        </div>
                                    )}
                                    {showResult === 'good-delete-practice' && (
                                        <div className="absolute transition-width shadow-xl top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-emerald-400  transform animate-messagge-from-right">
                                            <div className='flex justify-start items-center'>
                                                <TiDocumentDelete className='text-black' size={28} />
                                                <p className='ml-1 text-black font-semibold text-lg select-none'>La práctica a sido eliminada</p>
                                            </div>
                                        </div>
                                    )}
                                    {showResult === 'good-prices-update' && (
                                        <div className="absolute transition-width shadow-xl top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-emerald-400  transform animate-messagge-from-right">
                                            <div className='flex justify-start items-center'>
                                                <IoLogoUsd className='text-black' size={24} />
                                                <p className='ml-1 text-black font-semibold text-lg select-none'>Los precios han sido actualizados</p>
                                            </div>
                                        </div>
                                    )}
                                    {showResult === 'no-practices' && (
                                        <div className="absolute transition-width shadow-xl top-0 right-0 h-full rounded-l-xl flex justify-center items-center py-2 px-4 border-2 border-black rounded-tr-md bg-red-500  transform animate-messagge-from-right">
                                            <div className='flex justify-start items-center'>
                                                <RiAlertFill className='text-black' size={24} />
                                                <p className='ml-1 text-black font-semibold text-lg select-none'>No tienes practícas cargadas</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <table className="w-full overflow-y-hidden overflow-x-hidden  select-none shadow-xl">
                                    <thead>
                                        <tr className={`${chapterData.length < 1 ? '' : 'border-b-2'} bg-white select-none  border-gray-600 text-left text-xs font-semibold uppercase tracking-widest text-black`}>
                                            <th className={`${chapterData.length < 1 ? 'rounded-bl-md' : ''} py-3 pl-8`}>ID</th>
                                            <th className="px-1 py-3 pl-5 border-r-2 border-l-2 border-gray-600 ">Nombre de Práctica</th>
                                            <th className="px-1 pl-5 py-3">Precio</th>
                                            <th className={`${chapterData.length < 1 ? 'rounded-br-md' : ''} px-1 border-l-2 border-gray-600 py-3`}>Eliminar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-white bg-gray-400 bg-opacity-30">
                                        {chapterData.map((practice: any, index: any) => (
                                            <tr key={index} className={index === chapterData.length - 1 ? '' : 'border-b-2 border-gray-600 '} >
                                                <td className="pl-4 px-4   whitespace-nowrap border-r-2 border-gray-600 w-16">
                                                    <div className="text-center  text-white items-center justify-center flex rounded-full w-fit bg-teal-600 text-sm font-semibold">
                                                        <p className='ml-1.5 mr-1.5'>01.{practice.id}</p>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 whitespace-normal text-black text-sm border-r-2 border-gray-600">
                                                    <p>{practice.name}</p>
                                                </td>
                                                {openPriceEdit ? (
                                                    <td onClick={() => setOpenPriceEdit(false)}
                                                        className=" whitespace-nowrap w-auto text-black group flex items-center  hover:bg-teal-600 cursor-pointer transition duration-150 hover:text-white  justify-between">
                                                        <textarea className=' h-full  mr-4 flex justify-end'></textarea>
                                                    </td>
                                                ) : (
                                                    <td onClick={() => setOpenPriceEdit(true)}
                                                        className="px-5 whitespace-nowrap w-auto text-black group flex items-center  hover:bg-teal-600 py-4 cursor-pointer transition duration-150 hover:text-white  justify-between">
                                                        <p>${setFormattedPrice(practice.price)}</p>
                                                        <FaPen className="group-hover:text-white group-hover:duration-150 ml-2  text-black " />
                                                    </td>
                                                )}
                                                <td className=" pl-6 ml+5 whitespace-nowrap border-l-2 border-gray-600 w-6 text-black">
                                                    <button onClick={() => { setOpenAlert('delete'); setId(practice.id); setPracticeName(practice.name); setPrice(setFormattedPrice(practice.price)) }}><MdDelete size={24} className="hover:text-red-500 transform hover:scale-125 mt-2 ml-0.5 transition duration-150" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className='text-black border-2 h-fit border-gray-600 ml-auto mr-6 shadow-md rounded-lg w-60 select-none bg-gray-400 bg-opacity-30'>
                                <h1 className='flex justify-center items-center bg-white  text-black font-semibold text-xl py-2 border-b-2 border-gray-600 rounded-t-md'>AUMENTAR TODO</h1>
                                <div className='flex font-medium transition'>
                                    <button onClick={() => handleIncreaseOrDecrease(0.05, '+5%')} className='hover:bg-teal-600 w-1/2 duration-150 border-r-2 py-2 border-b-2 border-gray-600'>+5%</button>
                                    <button onClick={() => handleIncreaseOrDecrease(0.1, '+10%')} className='hover:bg-teal-600 w-1/2 duration-150 border-b-2 py-2 border-gray-600'>+10%</button>
                                </div>
                                <div className='flex font-medium transition'>
                                    <button onClick={() => handleIncreaseOrDecrease(0.15, '+15%')} className='hover:bg-teal-600 w-1/2 duration-150 border-r-2 py-2 border-b-2 border-gray-600'>+15%</button>
                                    <button onClick={() => handleIncreaseOrDecrease(0.2, '+20%')} className='hover:bg-teal-600 w-1/2 duration-150 border-b-2 py-2 border-gray-600'>+20%</button>
                                </div>
                                <h1 className='flex justify-center items-center bg-white   text-black font-semibold text-xl py-2 border-b-2 border-gray-600'>DISMINUIR TODO</h1>
                                <div className='flex font-medium transition'>
                                    <button onClick={() => handleIncreaseOrDecrease(-0.05, '-5%')} className='hover:bg-red-800 w-1/2 duration-150 border-r-2 py-2 border-b-2 border-gray-600'>-5%</button>
                                    <button onClick={() => handleIncreaseOrDecrease(-0.1, '-10%')} className='hover:bg-red-800 w-1/2 duration-150 border-b-2 py-2 border-gray-600'>-10%</button>
                                </div>
                                <div className='flex font-medium transition'>
                                    <button onClick={() => handleIncreaseOrDecrease(-0.15, '-15%')} className='hover:bg-red-800 w-1/2 duration-150 border-r-2 py-2 rounded-bl-md border-gray-600'>-15%</button>
                                    <button onClick={() => handleIncreaseOrDecrease(-0.2, '-20%')} className='hover:bg-red-800 w-1/2  duration-150 py-2 rounded-br-md border-gray-600'>-20%</button>
                                </div>
                            </div>
                        </div>
                    ) : null
                    }
                </div >
            )
            }
        </div >
    )
}
