'use client'

import React, { useState, useEffect } from 'react';
import { Loading } from "./../../components/general/loading";
import { InputAndOthers } from "./../../components/patients/ui/inputAndOthers";
import { Table } from "./../../components/patients/ui/table";
import { getPatients } from "./../../components/patients/db/getPatients";
import { SheetCreatePatient } from "./../../components/patients/ui/sheetCreatePatient";

export default function Patients() {
    const [isLoad, setIsLoad] = useState(true);
    const [isOpenSheetCreatePatient, setIsOpenSheetCreatePatient] = useState(false);
    const [listOfPatients, setListOfPatients] = useState<null | any[]>(null);
    const [isListOfPatientsComplete, setIsListOfPatientsComplete] = useState(false);
    const [loadMorePatientsButtom, setLoadMorePatientsButtom] = useState(true);
    const [searchContent, setSearchContent] = useState('');
    const [loadRow, setLoadRow] = useState<number | null>(null);

    //GET PATIENTS LOGIC
    async function handleGetPatients(quantity: number) {
        const data = await getPatients(quantity);
        if (data) {
            setIsListOfPatientsComplete(data.isFull);
            setListOfPatients(data.patients);
        }
        setLoadMorePatientsButtom(false);
    }

    useEffect(() => {
        if (listOfPatients) {
            setIsLoad(false);
        }
    }, [listOfPatients]);

    return (
        <div className='h-screen p-4 w-full overflow-hidden'>
            {isLoad && (
                <Loading />
            )}
            <SheetCreatePatient open={isOpenSheetCreatePatient} setOpen={setIsOpenSheetCreatePatient}/>
            <div className={`${isLoad ? 'opacity-0' : 'opacity-100'} transition-opacity duration-150`}>
                <InputAndOthers searchContent={searchContent} setSearchContent={setSearchContent} loadRow={loadRow} setListOfPatients={setListOfPatients} handleGetPatients={handleGetPatients} setIsOpenSheetCreatePatient={setIsOpenSheetCreatePatient} />

                <Table searchContent={searchContent} listOfPatients={listOfPatients} setLoadRow={setLoadRow} loadRow={loadRow} isListOfPatientsComplete={isListOfPatientsComplete} loadMorePatientsButtom={loadMorePatientsButtom} setLoadMorePatientsButtom={setLoadMorePatientsButtom} handleGetPatients={handleGetPatients} />
            </div>
        </div >
    );
}
