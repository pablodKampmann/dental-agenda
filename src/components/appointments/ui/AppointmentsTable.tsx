'use client'

import { timeCalc, TIME_SLOTS } from '../appointmentUtils';

interface Props {
  appointments: any[] | null;
  appointmentDate: any;
  date: string | null;
  onRowClick: (time: string, event: React.MouseEvent) => void;
}

export function AppointmentsTable({ appointments, appointmentDate, date, onRowClick }: Props) {
  return (
    <>
      <h1 className='text-center bg-teal-600 border-t-2 border-b-2 border-l-2 border-gray-600 rounded-bl-lg rounded-tl-lg shadow-xl text-white font-semibold text-4xl select-none px-4 pt-2'>
        A <br /> G <br />E <br />N <br />D <br />A
      </h1>
      <div className='bg-gray-300 bg-opacity-30 shadow-xl flex-1 transition-width border-2 border-gray-600 rounded-r-lg overflow-y-auto'>
        <table className='w-full'>
          <tbody className='text-black'>
            {TIME_SLOTS.map((time, index, array) => {
              const isSecondarySlot = appointments && Array.isArray(appointments) && appointments.some(
                (a: any) => a && (a.time2 === time || a.time3 === time || a.time4 === time || a.time5 === time || a.time6 === time)
              );

              const appointment = appointments && Array.isArray(appointments) &&
                appointments.find((a: any) => a && a.time === time);

              const rowSpan = appointment
                ? (appointment.time6 ? 6 : appointment.time5 ? 5 : appointment.time4 ? 4 : appointment.time3 ? 3 : appointment.time2 ? 2 : 1)
                : 1;

              const endTime = appointment ? (
                appointment.time6 ? timeCalc(appointment.time6)
                  : appointment.time5 ? timeCalc(appointment.time5)
                    : appointment.time4 ? timeCalc(appointment.time4)
                      : appointment.time3 ? timeCalc(appointment.time3)
                        : appointment.time2 ? timeCalc(appointment.time2)
                          : timeCalc(time)
              ) : timeCalc(time);

              if (isSecondarySlot) {
                return (
                  <tr key={time}>
                    <td className={`text-black select-none cursor-default align-top px-3 text-xs font-semibold pt-2 border-r ${index === array.length - 1 ? '' : 'border-b'} border-gray-600`}>
                      {time}
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={time}>
                  <td className={`text-black select-none cursor-default align-top px-3 text-xs font-semibold pt-2 border-r ${index === array.length - 1 ? '' : 'border-b'} border-gray-600`}>
                    {time}
                  </td>
                  <td
                    rowSpan={rowSpan}
                    className={`
                      ${appointment ? 'bg-teal-600 bg-opacity-20 pt-1 pb-1 px-2 hover:bg-opacity-70 hover:bg-teal-600' : 'p-8'}
                      ${appointmentDate && appointmentDate.date === date &&
                        (appointmentDate.time === time || appointmentDate.time2 === time || appointmentDate.time3 === time ||
                          appointmentDate.time4 === time || appointmentDate.time5 === time || appointmentDate.time6 === time)
                        ? 'animate-breathe bg-gray-400'
                        : 'hover:bg-gray-900 hover:bg-opacity-30'
                      }
                      ${index === array.length - 1 ? '' : 'border-b'}
                      select-none w-full border-gray-600 text-center cursor-pointer items-center`}
                    onClick={(e) => onRowClick(time, e)}
                  >
                    {appointment && (
                      <div className='flex justify-between'>
                        <div className='flex-col'>
                          <p className='text-left text-xs font-bold'>{time}-{endTime}</p>
                          <div className='flex mt-2'>
                            <p className='text-left text-sm ml-2'>Paciente:</p>
                            <p className='text-left text-sm font-semibold ml-1'>
                              {appointment.patientData.name}{' '}{appointment.patientData.lastName}
                            </p>
                          </div>
                          <div className='flex'>
                            <p className='text-left text-sm ml-2'>DNI:</p>
                            <p className='text-left text-sm font-semibold ml-1'>{appointment.patientData.dni}</p>
                          </div>
                          <div className='flex'>
                            <p className='text-left text-sm ml-2'>Contacto:</p>
                            <p className='text-left text-sm font-semibold ml-1'>
                              {appointment.patientData.num} <br /> {appointment.patientData.email}
                            </p>
                          </div>
                        </div>
                        <div className='mt-auto'>
                          <div className='flex'>
                            <p className='text-left text-sm ml-2'>Razón de turno:</p>
                            <p className='text-left text-sm font-semibold ml-1'>{appointment.reason}</p>
                          </div>
                          <div className='flex'>
                            <p className='text-left text-sm ml-2'>Observaciones:</p>
                            {appointment.observations ? (
                              <p className='text-left text-sm font-semibold ml-1'>{appointment.observations}</p>
                            ) : (
                              <p className='text-left text-sm font-semibold ml-1'>Ninguna</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
