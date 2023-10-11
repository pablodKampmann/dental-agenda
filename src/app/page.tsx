'use client'

import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import { setAppointment } from "./components/setAppointment";
import { SearchPatient } from "./components/searchPatient";
import { GetPatients } from "./components/getPatients"
import { BsPersonCheck } from 'react-icons/bs';
import { ClipLoader } from "react-spinners";

type ValuePiece = Date | null;

type Value = ValuePiece | [ValuePiece, ValuePiece];

export default function Page() {
  const [value, onChange] = useState<Value>(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedField, setSelectedField] = useState('name');
  const [searchContent, setSearchContent] = useState('');
  const [listPatients, setListPatients] = useState<null | any[] | string>(null);
  const [patient, setPatient] = useState<any>(null);

  function isWeekend(date: any) {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  async function handleSetAppointment() {
    //await setAppointment();
  }

  useEffect(() => {
    setSearchContent('');
  }, [selectedField]);


  useEffect(() => {
    if (searchContent.length > 0) {
      Search();
    }
    if (searchContent === "") {
      Get();
    }

    async function Search() {
      const patientsFilter = await SearchPatient(selectedField, searchContent)
      if (patientsFilter.length < 1) {
        setListPatients(null)
      } else {
        setListPatients(patientsFilter)
      }
    }

    async function Get() {
      const patients = await GetPatients(1, 20);
      if (patients === null) {
        setListPatients('noResult')
      } else {
        setListPatients(patients.patients)
      }
    }
  }, [searchContent])

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
          <button onClick={() => { setShowForm(!showForm); setPatient(null); setSearchContent('') }} className="shadow-xl h-10 bg-teal-500 hover:bg-teal-900 hover:border-teal-600 text-white text-xl font-semibold py-2  px-12 border-b-4 border-teal-700 rounded-lg flex items-center transition duration-200">
            {showForm ? (
              <div className='flex justify-center items-center w-44'>
                <p>Cancelar</p>
              </div>
            ) : (
              <div className='flex justify-center items-center w-44'>
                <p className="text-3xl mr-4 mb-1">+</p>
                <p>Agregar Turno</p>
              </div>
            )}
          </button>
        </div>
      </div>
      <div className='flex justify-between'>
        <div className='border-4 border-teal-500 rounded-2xl mr-2 shadow-xl flex-1 w-4/6'>
          <table className=''>
            <thead>
              <tr className='bg-gray-500 text-center cursor-default	'>
                <th className='border-2 border-teal-500 p-3 rounded-tl-xl'>Tiempo</th>
                <th className='border-2 border-teal-500 p-3 '>Lunes</th>
                <th className='border-2 border-teal-500 p-3 '>Martes</th>
                <th className='border-2 border-teal-500 p-3 '>Miércoles</th>
                <th className='border-2 border-teal-500 p-3 '>Jueves</th>
                <th className='border-2 border-teal-500 p-3 rounded-tr-xl'>Viernes</th>
              </tr>
            </thead>
            <tbody className=''>
              {['7:00', '8:00', '9:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((time) => (
                <tr key={time}>
                  <td className='cursor-default	 bg-gray-500 border-2 border-teal-500 text-center'>{time}</td>
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((day) => (
                    <td
                      key={day}
                      className='border-2 border-teal-500 text-center'
                    >
                      <div onClick={() => setShowForm(true)} className={`cursor-pointer w-40 h-15 p-3 ${showForm ? 'hover:bg-teal-500' : ''}`}>
                        <p>Hola</p>
                      </div>
                    </td>
                  ))}
                </tr>

              ))}

            </tbody>
          </table>
        </div>
        <div className="flex w-4/12 ml-16">
          {showForm ? (
            <div className='flex-1 flex-col border-4 border-teal-500 rounded-xl h-full shadow-lg bg-zinc-200'>
              <div className={`border-teal-700 border-b-4 +
               ${patient ? '' : 'flex-1'}`}>
                {patient ? (
                  <div className='ml-2 mt-2 mr-2 flex items-center justify-center bg-teal-500 rounded-full h-10 cursor-default shadow-lg'>
                    <h1 className='font-black	text-4xl text-teal-800 mr-4'>1</h1>
                    <h1 className='font-black	text-4xl text-teal-800 mr-4'>CHECK</h1>
                    <BsPersonCheck size={38} className="text-teal-800 " />
                  </div>
                ) : (
                  <div>
                    <div className='ml-2 mt-2 mr-2 flex items-center justify-center bg-teal-500 rounded-full h-10 cursor-default shadow-lg'>
                      <h1 className='font-black	text-4xl text-teal-800 mr-4'>1</h1>
                      <h1 className=' text-xl font-bold text-teal-800 text-center cursor-default'>Selecciona el paciente</h1>
                    </div>
                    <div className='mt-4 ml-2 mr-2 flex'>
                      <input name='search'
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
                        type="text" placeholder='Busca un paciente' className='focus:border-3 focus:outline-none focus:border-teal-200 rounded-lg text-white h-10 shadow-lg p-2 w-full bg-gray-500 border-2 border-teal-500' />
                      <button onClick={() => setSelectedField('dni')} className={`${selectedField === 'dni' ? 'bg-teal-500 border-teal-200 border-4' : 'bg-gray-500 hover:bg-teal-900'}  shadow-lg ml-4 w-24 h-10 border-2 focus:outline-none border-teal-500 text-white text-lg font-semibold rounded-l-lg transition duration-300`}>DNI</button>
                      <button onClick={() => setSelectedField('name')} className={`${selectedField === 'name' ? 'bg-teal-500 border-teal-200 border-4' : 'bg-gray-500 hover:bg-teal-900'}  shadow-lg w-40 h-10 border-2 focus:outline-none border-teal-500 text-white  text-lg font-semibold rounded-r-lg transition duration-300`}>Nombre</button>
                    </div>
                  </div>
                )}

                <div className='mt-4 ml-2 mr-2 mb-2 border-2 border-teal-300 rounded-lg bg-gray-500 overflow-auto'>
                  <div className={`${patient ? 'h-fit' : 'h-40'} `}>
                    {listPatients ? (
                      <div>
                        {patient ? (
                          <div className='hover:bg-teal-900 flex justify-center cursor-pointer'>
                            <p className=' text-lg text-teal-300 text-center'>Paciente seleccionado: </p>
                            <p className='ml-1 text-lg text-teal-300 text-center font-bold'>{patient.name} {patient.lastName}</p>
                          </div>
                        ) : (
                          <div>
                            {listPatients.map((patient, index) => (
                              <div key={index} onClick={() => setPatient(patient)} className="p-1 hover:bg-teal-900 border-b border-teal-500 transition duration-100 cursor-pointer flex justify-between">
                                <p className='ml-1'>
                                  {patient.name} {patient.lastName}
                                </p>
                                <p className='mr-1'>
                                  {patient.dni}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="ml-2 p-1">
                        {listPatients === 'noResult' ? (
                          <p>Sin resultados...</p>
                        ) : (
                          <div className='flex justify-center items-center mt-14 mb-14'>
                            <ClipLoader color='rgb(20 184 166)' size={36} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className='border-teal-700 border-b-4 flex-1 '>
                <div className='ml-2 mt-2 mr-2 flex items-center justify-center bg-teal-500 rounded-full h-10 cursor-default shadow-lg'>
                  <h1 className='font-black	text-4xl text-teal-800 mr-4'>2</h1>
                  <h1 className=' text-xl font-bold text-teal-800 text-center cursor-default'>Selecciona la fecha</h1>
                </div>
              </div>
              <div className='flex-1' >
                <div className='ml-2 mt-2 mr-2 flex items-center justify-center bg-teal-500 rounded-full h-10 cursor-default shadow-lg'>
                  <h1 className='font-black	text-4xl text-teal-800 mr-4'>3</h1>
                  <h1 className=' text-xl font-bold text-teal-800 text-center cursor-default'>Confirmar Turno</h1>
                </div>
              </div>
            </div>
          ) : (
            <div>
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
          )}
        </div>
      </div >
    </div >
  )

}
