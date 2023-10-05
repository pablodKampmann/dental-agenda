'use client'

import Image from 'next/image'
import { useState } from 'react';
import Calendar from 'react-calendar';

export default function Page() {
  const [value, onChange] = useState(new Date());

  function isWeekend(date: any) {
    const day = date.getDay(); 
    return day === 0 || day === 6;
  }

  return (
    <div className="ml-72 p-4 mt-20 mr-10 relative">
      <div className='mb-4 flex justify-between items-center'>
        <div>
          <h1 className='font-bold text-lg text-teal-900'>Jueves 10 de Noviembre (2023)</h1>
        </div>
        <div>
          eoiefjnoq
        </div>
        <div>
          <button className="shadow-xl h-10 bg-teal-500 hover:bg-teal-900 hover:border-teal-600 text-white text-xl font-semibold py-2  px-12 border-b-4 border-teal-700 rounded-lg flex items-center transition duration-200">
            <span className="text-3xl text-center mr-4">+</span> Agregar Turno
          </button>
        </div>
      </div>
      <div className='flex justify-between'>

        <div className='border-4 border-teal-500 rounded-2xl mr-2'>
          <table className='w-full'>
            <thead>
              <tr className='bg-gray-500 text-center'>
                <th className='border-2 border-teal-500 p-3 rounded-tl-xl'>Tiempo</th>
                <th className='border-2 border-teal-500 p-3 '>Lunes</th>
                <th className='border-2 border-teal-500 p-3 '>Martes</th>
                <th className='border-2 border-teal-500 p-3 '>Miercoles</th>
                <th className='border-2 border-teal-500 p-3 '>Jueves</th>
                <th className='border-2 border-teal-500 p-3 rounded-tr-xl'>Viernes</th>
              </tr>
            </thead>
            <tbody className='w-full'>
              {['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '19:00'].map((time) => (
                <tr key={time}>
                  <td className='border-2 border-teal-500 p-3 text-center bg-gray-500'>{time}</td>
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day) => (
                    <td key={day} className='border-2 border-teal-500 p-3 text-center'>
                      {`${day} ${time}:00`}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border border-dashed border-gray-600 ml-2">
          <Calendar onChange={onChange}
          value={value} 
          className="bg-gray-900 rounded-lg" 
          tileDisabled={({ date }) => isWeekend(date)} 
          />

        </div>
      </div>
    </div>
  )

}
