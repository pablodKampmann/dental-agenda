'use client'

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation'
import { auth } from "./../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FaTooth } from "react-icons/fa";
import { setOptions } from "./../components/setOptions[TEMP]";
import { getChapter } from "./../components/getChapter";
import { ClipLoader } from "react-spinners";
import { HiFolderAdd } from "react-icons/hi";
import { MdDelete } from "react-icons/md";
import { FiBookmark } from "react-icons/fi";
import { FaPen } from "react-icons/fa";
import { deletePractice } from "./../components/deletePractice";
import { ModalCreatePractice } from "./../components/modalCreatePractice";

export default function Page() {
    const router = useRouter()
    const [isLoad, setIsLoad] = useState(true);
    const [chapter, setChapter] = useState("chapterI");
    const [chapterData, setChapterData] = useState<any>(null);
    const [practiceName, setPracticeName] = useState<string>('');
    const [isLoadData, setIsLoadData] = useState(true);
    const [openPriceEdit, setOpenPriceEdit] = useState(false);
    const [openModalCreatePractice, setOpenModalCreatePractice] = useState(false);
    const [showResult, setShowResult] = useState<any>(null);

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
                setPracticeName(practice);
                if (data && practice) {
                    setIsLoadData(false);
                }
            }
        }

        get();
    }, [chapter]);

    function setPrice(price: number) {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    async function handleDelete(id: number) {
        await deletePractice(id, chapter)
    }

    async function updatePractices() {
        setIsLoadData(true);
        const { data, practice } = await getChapter(chapter)
        if (data && practice) {
            const filteredData = data.filter(item => !Object.values(item).every(value => value === undefined));
            setChapterData(filteredData);
            setPracticeName(practice);
            if (data && practice) {
                setIsLoadData(false);
            }
        }
    }

    return (
        <div className='ml-56 h-screen overflow-y-auto     flex-1 mt-2 ' >
            {isLoad ? (
                <div className='fixed inset-0 backdrop-blur-sm ml-56'>
                    <div className='fixed inset-0 flex items-center justify-center'>
                        <div className='bg-teal-900 py-10 px-10 rounded-full shadow-xl animate-spin'>
                            <FaTooth size={100} />
                        </div>
                    </div>
                </div>
            ) : (
                <div>
                    {openModalCreatePractice && (
                        <div className="fixed inset-0 backdrop-blur-sm ml-56 z-10">
                            <ModalCreatePractice chapter={chapter} onCloseModal={() => setOpenModalCreatePractice(false)} onSuccess={() => { setShowResult('good-practice'); updatePractices() }} />
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
                                    <h1 className='bg-gray-300 bg-opacity-30 text-black uppercase ml-4 text-xl font-bold border-t-4 px-4 border-b-4 border-teal-600 rounded-2xl shadow-lg h-12 flex justify-center items-center'>{practiceName}</h1>
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
                            <div className='mx-6 h-fit rounded-lg w-full border-2 border-gray-600 overflow-y-hidden over'>
                                <h1 className='bg-teal-600 text-3xl pb-1.5 text-center py-1 select-none font-medium border-b-2 border-gray-600 px-4'>Aranceles </h1>
                                <table className="w-full overflow-y-hidden overflow-x-hidden  select-none shadow-xl">
                                    <thead>
                                        <tr className="bg-white select-none border-b-2 border-gray-600 text-left text-xs font-semibold uppercase tracking-widest text-black">
                                            <th className="px-1 py-3 pl-6">ID</th>
                                            <th className="px-1 py-3 pl-5 border-r-2 border-l-2 border-gray-600 ">Nombre de Práctica</th>
                                            <th className="px-1 pl-5 py-3">Precio</th>
                                            <th className="px-1 border-l-2 border-gray-600 py-3">Eliminar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-white bg-gray-400 bg-opacity-30">
                                        {chapterData.map((practice: any, index: any) => (
                                            <tr key={index} className={index === chapterData.length - 1 ? '' : 'border-b-2 border-gray-600 '} >
                                                <td className="pl-4  whitespace-nowrap border-r-2 border-gray-600 w-16">
                                                    <div className="text-center  text-white items-center justify-center flex rounded-full w-fit bg-teal-600 text-sm font-semibold">
                                                        <p className='ml-1.5 mr-1.5'>0.{practice.id}</p>
                                                    </div>
                                                </td>
                                                <td className="px-5  whitespace-nowrap text-black text-sm border-r-2 border-gray-600">
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
                                                        <p>${setPrice(practice.price)}</p>
                                                        <FaPen className="group-hover:text-white group-hover:duration-150  text-black " />
                                                    </td>
                                                )}
                                                <td className="px-5 whitespace-nowrap border-l-2 border-gray-600 w-6 text-black">
                                                    <button onClick={() => handleDelete(practice.id)}><MdDelete size={24} className="hover:text-red-500 transform hover:scale-125 mt-2 ml-1 transition duration-150" /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className='text-black border-2 border-gray-600 ml-auto mr-6 shadow-md rounded-lg w-60 select-none bg-gray-400 bg-opacity-30'>
                                <h1 className='flex justify-center items-center bg-teal-600  text-white font-semibold text-xl py-2 border-b-2 border-gray-600 rounded-t-md'>AUMENTAR TODO</h1>
                                <div className='flex font-medium'>
                                    <button className='hover:bg-teal-600 w-1/2 border-r-2 py-2 border-b-2 border-gray-600'>+5%</button>
                                    <button className='hover:bg-teal-600 w-1/2 border-b-2 py-2 border-gray-600'>+10%</button>
                                </div>
                                <div className='flex font-medium'>
                                    <button className='hover:bg-teal-600 w-1/2 border-r-2 py-2 border-b-2 border-gray-600'>+15%</button>
                                    <button className='hover:bg-teal-600 w-1/2 border-b-2 py-2 border-gray-600'>+20%</button>
                                </div>
                                <h1 className='flex justify-center items-center bg-teal-600  text-white font-semibold text-xl py-2 border-b-2 border-gray-600'>DISMINUIR TODO</h1>
                                <div className='flex font-medium'>
                                    <button className='hover:bg-teal-600 w-1/2 border-r-2 py-2 border-b-2 border-gray-600'>-5%</button>
                                    <button className='hover:bg-teal-600 w-1/2 border-b-2 py-2 border-gray-600'>-10%</button>
                                </div>
                                <div className='flex font-medium'>
                                    <button className='hover:bg-teal-600 w-1/2 border-r-2 py-2 rounded-bl-md border-gray-600'>-15%</button>
                                    <button className='hover:bg-teal-600 w-1/2  py-2 rounded-br-md border-gray-600'>-20%</button>
                                </div>
                            </div>
                        </div>
                    ) : null
                    }
                </div >
            )}
        </div >
    )
}
