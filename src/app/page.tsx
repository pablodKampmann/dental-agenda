import Image from 'next/image'

export default function Page() {
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
      <div className='border-4 border-teal-500 rounded-2xl'>
        <table className='w-full'>
          <thead>
            <tr>
              <th className='border-2 border-teal-500 p-3 text-center'>Dias</th>
              <th className='border-2 border-teal-500 p-3 text-center'>Lunes</th>
              <th className='border-2 border-teal-500 p-3 text-center'>Martes</th>
              <th className='border-2 border-teal-500 p-3 text-center'>Miercoles</th>
              <th className='border-2 border-teal-500 p-3 text-center'>Jueves</th>
              <th className='border-2 border-teal-500 p-3 text-center'>Viernes</th>
            </tr>
          </thead>
          <tbody className='w-full'>
            {['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '19:00'].map((time) => (
              <tr key={time}>
                <td className='border-2 border-teal-500 p-3 text-center'>{time}</td>
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
    </div>
  )

}
