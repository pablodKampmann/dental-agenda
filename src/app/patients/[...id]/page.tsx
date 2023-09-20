'use client'

import { useSearchParams } from 'next/navigation'

export default function patientId() {
  const searchParams = useSearchParams()
  const id = searchParams.get('patientId');
  if (id !== null) {
    const patient = JSON.parse(id);
    return (
      <div className=' h-full border-4 border-white ml-4 mr-4'>

      </div>
    );
  }
}
