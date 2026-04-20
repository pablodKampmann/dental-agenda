'use client'

import React, { useState, useEffect } from 'react';
import { getUser } from '@/components/auth/getUser';
import { Loading } from "./../../components/general/loading";
import { InputAndOthers } from "./../../components/patients/ui/inputAndOthers";
import { Table } from "./../../components/patients/ui/table";
import { getPatients } from "./../../components/patients/db/getPatients";
import { SheetCreatePatient } from "../../components/patients/ui/createPatient/sheetCreatePatient";

export default function Patients() {
    const [isLoad, setIsLoad] = useState(true);
    const [isOpenSheetCreatePatient, setIsOpenSheetCreatePatient] = useState(false);
    const [listOfPatients, setListOfPatients] = useState<null | any[]>(null);
    const [isListOfPatientsComplete, setIsListOfPatientsComplete] = useState(false);
    const [loadMorePatientsButtom, setLoadMorePatientsButtom] = useState(true);
    const [searchContent, setSearchContent] = useState('');
    const [loadRow, setLoadRow] = useState<number | null>(null);


    const [clinicId, setClinicId] = useState<string | null>(null);

    useEffect(() => {
        async function fetchClinicId() {
            const id = await getUser(true);
            setClinicId(id as string);
        }
        fetchClinicId();
    }, []);
    useEffect(() => {
        if (clinicId) {
            handleGetPatients(20);
        }
    }, [clinicId]);

    //GET PATIENTS LOGIC
    async function handleGetPatients(quantity: number) {
        if (!clinicId) return;
        const data = await getPatients(quantity, clinicId);
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
            <SheetCreatePatient open={isOpenSheetCreatePatient} setOpen={setIsOpenSheetCreatePatient} handleGetPatients={handleGetPatients} />
            <div className={`${isLoad ? 'opacity-0' : 'opacity-100'} transition-opacity duration-150`}>
                <InputAndOthers clinicId={clinicId} searchContent={searchContent} setSearchContent={setSearchContent} loadRow={loadRow} setListOfPatients={setListOfPatients} handleGetPatients={handleGetPatients} setIsOpenSheetCreatePatient={setIsOpenSheetCreatePatient} />

                <Table searchContent={searchContent} listOfPatients={listOfPatients} setLoadRow={setLoadRow} loadRow={loadRow} isListOfPatientsComplete={isListOfPatientsComplete} loadMorePatientsButtom={loadMorePatientsButtom} setLoadMorePatientsButtom={setLoadMorePatientsButtom} handleGetPatients={handleGetPatients} />
            </div>
        </div >
    );
}
