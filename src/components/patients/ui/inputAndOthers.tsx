
import React, { useState, useEffect } from 'react';
import { TbUserSearch } from 'react-icons/tb';
import { ClipLoader } from "react-spinners";
import { SearchPatient } from "./../../../components/patients/db/searchPatient";
import { BsPersonFillAdd } from "react-icons/bs";

interface props {
    searchContent: string;
    setSearchContent: (value: string) => void;
    loadRow: number | null;
    setListOfPatients: (value: any) => void;
    handleGetPatients: (quantity: number) => void;
    setIsOpenSheetCreatePatient: (value: boolean) => void;
    clinicId: string | null; 
}

export function InputAndOthers({ searchContent, setSearchContent, loadRow, setListOfPatients, handleGetPatients, setIsOpenSheetCreatePatient, clinicId }: props) {
    const [selectedField, setSelectedField] = useState('name');

    //SEARCH PATIENTS LOGIC
    useEffect(() => {
        setSearchContent('');
    }, [selectedField]);

    useEffect(() => {
        let isCancelled = false;

        if (searchContent.length < 1) {
            handleGetPatients(10);
        } else {
            const searchPatients = async () => {
                const patientsFilter = await SearchPatient(selectedField, searchContent, clinicId!);
                if (!isCancelled) {
                    setListOfPatients(patientsFilter);
                }
            };
            searchPatients();
        }

        return () => {
            isCancelled = true;
        };
    }, [searchContent, selectedField]);

    return (
        <div className="flex flex-wrap md:h-10 md:space-y-0 space-y-3 h-8">
            <div className="flex h-full">
                <div className='rounded-xl flex justify-between h-full border-2 border-gray-600 '>
                    <div className='flex justify-center items-center'>
                        <TbUserSearch
                            className="text-teal-600 bg-transparent mx-1"
                            size={20}
                        />
                    </div>
                    <input
                        autoComplete="off"
                        type="text"
                        placeholder="Busca un paciente                      Por:"
                        className="pl-1 md:w-60 w-36 h-full bg-transparent rounded-r-md  font-semibold focus:outline-none text-black md:text-sm text-xs"
                        name='search'
                        value={searchContent}
                        onChange={(e) => {
                            const inputValue = e.target.value;
                            if (selectedField === 'dni') {
                                const numericValue = inputValue.replace(/[^0-9]/g, '');
                                setSearchContent(numericValue);
                            } else {
                                setSearchContent(inputValue);
                            }
                        }}
                    />
                </div>
                <div className='h-full md:text-sm text-xs font-semibold flex w-fit ml-1 md:px-3 px-1 select-none text-black '>
                    <button onClick={() => setSelectedField('name')} className={`${selectedField === 'name' ? 'bg-teal-600  text-white' : 'bg-white  hover:bg-teal-800 hover:text-white  '}  h-full  border-y-2 border-l-2 focus:outline-none border-gray-600 transition duration-150  rounded-l-lg md:w-24 px-2`}>NOMBRE</button>
                    <div className='h-full w-0.5 bg-gray-600'></div>
                    <button onClick={() => setSelectedField('dni')} className={`${selectedField === 'dni' ? 'bg-teal-600 text-white' : ' hover:bg-teal-800 bg-white hover:text-white  '} h-full border-y-2 border-r-2 focus:outline-none border-gray-600 transition duration-150  rounded-r-lg  md:w-16 px-2`}>DNI</button>
                </div>
                {(loadRow !== null || searchContent !== '') && (
                    <div className='ml-2 flex justify-center items-center'>
                        <ClipLoader speedMultiplier={1.7} color='black' size={30} />
                    </div>
                )}
            </div>
            <button onClick={() => setIsOpenSheetCreatePatient(true)} type="button" className="shadow-lg h-full md:w-fit w-full  md:my-0 my-4 md:ml-auto text-black hover:bg-teal-600 hover:border-gray-600 hover:text-white md:text-base text-sm font-semibold  px-4 border-b-4 border-2 border-b-teal-600 border-gray-600 rounded-xl flex items-center justify-center transition duration-150">
                <BsPersonFillAdd className="mr-2" size={20} />
                Agregar Paciente
            </button>
        </div>
    );
}