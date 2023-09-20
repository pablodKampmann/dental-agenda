'use client'

import { useSearchParams } from 'next/navigation'

export default function patientId() {
    const searchParams = useSearchParams()
    const patientData = searchParams.get('patientData');
    if (patientData !== null) {
        const patient = JSON.parse(patientData);
        console.log(patient);
        return (
          <div className='flex items-center text-white ml-32 mt-8'>
            <h1>{patient.name}</h1>
            <h1>{patient.lastName}</h1>
            <h1>{patient.num}</h1>
            <h1>{patient.dni}</h1>


          </div>
        );
      }
}
