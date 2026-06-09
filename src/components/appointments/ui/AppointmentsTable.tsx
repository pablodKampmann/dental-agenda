'use client'

import { MdPhone, MdOutlineEmail, MdOutlinePermIdentity } from 'react-icons/md';
import { timeCalc, TIME_SLOTS } from '../appointmentUtils';

function getInitials(name: string, lastName: string): string {
  return `${name?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

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
      <div className='scroll-rounded bg-gray-300 bg-opacity-30 shadow-xl flex-1 transition-width border-2 border-gray-600 rounded-r-lg overflow-y-auto'>
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
                    <td className={`bg-white text-black select-none cursor-default align-top px-3 text-xs font-semibold pt-2 border-r ${index === array.length - 1 ? '' : 'border-b'} border-gray-600`}>
                      {time}
                    </td>
                  </tr>
                );
              }

              const paddingClass = {
                1: 'py-5',
                2: 'py-8',
                3: 'py-12',
                4: 'py-16',
                5: 'py-20',
                6: 'py-24',
              }[rowSpan] ?? 'py-8';

              const isSelected = !!(
                appointmentDate &&
                appointmentDate.date === date &&
                (appointmentDate.time === time ||
                  appointmentDate.time2 === time ||
                  appointmentDate.time3 === time ||
                  appointmentDate.time4 === time ||
                  appointmentDate.time5 === time ||
                  appointmentDate.time6 === time)
              );

              return (
                <tr key={time}>
                  <td className={`bg-white w-px whitespace-nowrap text-black select-none cursor-default align-top px-4 text-xs font-semibold pt-2 border-r ${index === array.length - 1 ? '' : 'border-b'} border-gray-600`}>
                    {time}
                  </td>
                  <td
                    rowSpan={rowSpan}
                    style={{ minHeight: `${rowSpan * 60}px` }}
                    className={`
                      ${appointment
                        ? `bg-white hover:bg-teal-50 border-l-[3px] border-teal-500 ${paddingClass} px-3`
                        : isSelected ? 'slot-selected p-8' : 'p-8 hover:bg-gray-900 hover:bg-opacity-30'
                      }
                      ${index === array.length - 1 ? '' : 'border-b'}
                      select-none border-gray-600 cursor-pointer
                    `}
                    onClick={(e) => onRowClick(time, e)}
                  >
                    {appointment && (
                      <div className='flex items-start gap-3 h-full'>
                        {/* Avatar */}
                        <div className='w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5'>
                          {getInitials(appointment.patientData.name, appointment.patientData.lastName)}
                        </div>
                        {/* Content */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex justify-between items-start gap-2'>
                            <div className='min-w-0'>
                              <p className='text-sm font-bold text-black leading-tight truncate'>
                                {appointment.patientData.name} {appointment.patientData.lastName}
                              </p>
                              {appointment.reason && (
                                <p className='text-xs font-semibold text-teal-700 mt-0.5 truncate'>
                                  {appointment.reason?.name ?? appointment.reason}
                                </p>
                              )}
                            </div>
                            <span className='text-xs font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full flex-shrink-0'>
                              {time} – {endTime}
                            </span>
                          </div>
                          <div className='flex gap-4 mt-1.5 flex-wrap'>
                            <span className='flex items-center gap-1 text-xs text-gray-400'>
                              <MdOutlinePermIdentity size={13} />
                              {appointment.patientData.dni}
                            </span>
                            {appointment.patientData.num && (
                              <span className='flex items-center gap-1 text-xs text-gray-400'>
                                <MdPhone size={13} />
                                {appointment.patientData.num}
                              </span>
                            )}
                            {appointment.patientData.email && (
                              <span className='flex items-center gap-1 text-xs text-gray-400'>
                                <MdOutlineEmail size={13} />
                                {appointment.patientData.email}
                              </span>
                            )}
                            {appointment.observations && (
                              <span className='text-xs text-gray-400 italic truncate'>
                                "{appointment.observations}"
                              </span>
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