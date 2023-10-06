'use client'

import Image from 'next/image'
import { useState } from 'react';
import Calendar from 'react-calendar';

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function Page() {
  const [value, onChange] = useState<Value>(new Date());

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
      <div className='flex justify-between w-full ' >

        <div className='border-4 border-teal-500 rounded-2xl mr-2 shadow-xl'>
          <table className='w-full'>
            <thead>
              <tr className='bg-gray-500 t  ext-center'>
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
                      {`turno`}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ml-2 w-3/12">
          <div className='shadow-xl'>
            <Calendar onChange={onChange}
              value={value}
              className="bg-teal-700 border-4 border-teal-500 rounded-lg "
              maxDate={new Date(2099, 11, 31)}
              defaultValue={new Date()}
              view="month"
              locale="es-ES"
            />
          </div>
          <div className='border-4 mt-4 border-teal-500 rounded-lg shadow-xl bg-teal-500'>
            <div className='bg-teal-500'>
              <h1 className='font-bold text-center text-xl'>Turnos del día</h1>
            </div>
            <div className='border-4 rounded-md border-teal-800 bg-white'>
              <div className='flex bg-gray-500 hover:bg-gray-400 text-md py-2'>
                <p className='ml-1'>Maria Gonzales </p>
                <p className='ml-auto mr-2'>10:30</p>
              </div>
              <div className='flex bg-gray-500 hover:bg-gray-400 text-md py-2 border-t-2 border-dashed border-teal-500'>
                <p className='ml-1'>Jose Mario</p>
                <p className='ml-auto mr-2'>11:30</p>

              </div>
              <div className='flex bg-gray-500 hover:bg-gray-400 text-md py-2 border-t-2 border-dashed border-teal-500'>
                <p className='ml-1'>Vicenzo Giorda</p>
                <p className='ml-auto mr-2'>15:30</p>

              </div>
              <div className='flex bg-gray-500 hover:bg-gray-400 text-md  py-2 border-t-2 border-dashed border-teal-500'>
                <p className='ml-1'>Pablo Mario</p>
                <p className='ml-auto mr-2'>16:00</p>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

}
