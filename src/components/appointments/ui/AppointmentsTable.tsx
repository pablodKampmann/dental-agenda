'use client'

import { MdPhone, MdOutlineEmail, MdOutlinePermIdentity } from 'react-icons/md';
import { AvatarFallback } from '../../shared/AvatarFallback';
import { timeCalc, TIME_SLOTS } from '../appointmentUtils';

interface Props {
  appointments: any[] | null;
  appointmentDate: any;
  date: string | null;
  onRowClick: (time: string, event: React.MouseEvent) => void;
  /** `${date}-${time}` del turno sobre el que está abierto el popover de Acciones, o que se
   *  está editando — para darle un trato visual distinto mientras dura esa interacción, así
   *  el usuario sabe con cuál está interactuando. `null`/`undefined` cuando ninguno. */
  activeAppointmentKey?: string | null;
}

const TIME_CELL = "w-px whitespace-nowrap align-top select-none cursor-default bg-gray-50 border-r border-gray-200 px-4 pt-2 text-xs font-semibold text-gray-400";

export function AppointmentsTable({ appointments, appointmentDate, date, onRowClick, activeAppointmentKey }: Props) {
  return (
    <div className='flex-1 min-h-0 overflow-y-auto'>
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

            const isLast = index === array.length - 1;

            if (isSecondarySlot) {
              return (
                <tr key={time}>
                  <td className={`${TIME_CELL} ${isLast ? '' : 'border-b border-b-gray-100'}`}>
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

            const isActive = !!appointment && activeAppointmentKey === `${date}-${time}`;

            return (
              <tr key={time}>
                <td className={`${TIME_CELL} ${isLast ? '' : 'border-b border-b-gray-100'}`}>
                  {time}
                </td>
                <td
                  rowSpan={rowSpan}
                  style={{ minHeight: `${rowSpan * 60}px` }}
                  className={`
                    relative
                    ${appointment
                      ? isActive
                        ? `bg-teal-50 ${paddingClass} px-3`
                        : `hover:bg-gray-50 ${paddingClass} px-3`
                      : isSelected ? 'slot-selected p-8' : 'p-8 hover:bg-gray-50'
                    }
                    ${isLast ? '' : 'border-b border-b-gray-100'}
                    select-none cursor-pointer transition duration-150
                  `}
                  onClick={(e) => onRowClick(time, e)}
                >
                  {appointment && (
                    <span
                      aria-hidden
                      className={`absolute left-0 top-0 bottom-0 bg-teal-600 ${isActive ? 'w-1' : 'w-[3px]'}`}
                    />
                  )}
                  {appointment && (
                    <div
                      key={`${date}-${time}`}
                      className='flex items-start gap-3 h-full animate-carousel-reveal'
                      style={{ animationDelay: `${Math.min(index * 25, 200)}ms`, animationFillMode: 'both' }}
                    >
                      <AvatarFallback
                        displayName={`${appointment.patientData.name} ${appointment.patientData.lastName}`}
                        size={32}
                        className='rounded-full flex-shrink-0 mt-0.5'
                      />
                      <div className='flex-1 min-w-0'>
                        <div className='flex justify-between items-start gap-2'>
                          <div className='min-w-0'>
                            <p className='text-sm font-semibold text-black leading-tight truncate'>
                              {appointment.patientData.name} {appointment.patientData.lastName}
                            </p>
                            {appointment.reason && (
                              <p className='text-xs font-semibold text-teal-700 mt-0.5 truncate'>
                                {appointment.reason?.name ?? appointment.reason}
                              </p>
                            )}
                          </div>
                          <span className='text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex-shrink-0'>
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
  );
}
