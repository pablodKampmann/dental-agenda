'use client'

import { IoTimeOutline } from 'react-icons/io5';
import { MdOutlineTimer } from 'react-icons/md';
import { timeCalc, getAppointmentTreatments, treatmentsLabel } from '../appointmentUtils';

function formatCountdown(diffMins: number): string {
  if (diffMins < 60) return `${diffMins}min`;
  const h = Math.floor(diffMins / 60);
  const m = diffMins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}min`;
}

interface Props {
  appointments: any[] | null;
  isCurrentViewToday: boolean;
  time: string;
  alwaysToday: string | null;
}

export function RemainingAppointments({ appointments, isCurrentViewToday, time, alwaysToday }: Props) {
  const [nowH, nowM] = time.split(':').map(Number);
  const nowTotal = nowH * 60 + nowM;

  const todayAppointments = isCurrentViewToday && appointments ? appointments : [];

  return (
    <div className='flex-[40] [@media(min-height:850px)]:flex-[55] min-h-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden select-none text-black'>
      {/* Card header */}
      <div className='shrink-0 px-4 pt-3 pb-2.5 border-b border-gray-200 bg-gray-50'>
        <div className='flex items-center justify-between gap-2'>
          <h2 className='text-base font-bold text-black tracking-tight'>Turnos restantes</h2>
          <span className='flex items-center gap-1 text-xs font-semibold text-gray-500'>
            <IoTimeOutline size={15} />
            {time}
          </span>
        </div>
        <p className='text-xs text-gray-400 truncate'>Hoy · {alwaysToday}</p>
      </div>

      <div className='flex-1 min-h-0 overflow-y-auto'>
        {todayAppointments.length === 0 ? (
          <p className='text-center text-sm text-gray-400 font-medium py-6'>
            No hay turnos agendados para hoy
          </p>
        ) : (
          todayAppointments.map((appt: any, index: number) => {
            if (!appt || !appt.time) return null;

            const [aH, aM] = appt.time.split(':').map(Number);
            const startTotal = aH * 60 + aM;

            const endTime = appt.time6 ? timeCalc(appt.time6)
              : appt.time5 ? timeCalc(appt.time5)
                : appt.time4 ? timeCalc(appt.time4)
                  : appt.time3 ? timeCalc(appt.time3)
                    : appt.time2 ? timeCalc(appt.time2)
                      : timeCalc(appt.time);

            const [eH, eM] = endTime.split(':').map(Number);
            const endTotal = eH * 60 + eM;

            const isPast = endTotal <= nowTotal;
            const isOngoing = startTotal <= nowTotal && nowTotal < endTotal;
            const diffMins = startTotal - nowTotal;
            const isUpcoming = !isPast && !isOngoing;
            const isUrgent = isUpcoming && diffMins <= 30;

            return (
              <div
                key={index}
                className={`flex justify-between items-center gap-2 px-4 py-2 border-b border-gray-100 last:border-b-0 ${isPast ? 'opacity-40' : ''}`}
              >
                <div className={`min-w-0 ${isPast ? 'line-through' : ''}`}>
                  <p className='text-xs font-semibold text-gray-400'>{appt.time} – {endTime}</p>
                  <p className='text-sm font-semibold text-black truncate'>
                    {appt.patientData?.name} {appt.patientData?.lastName}
                  </p>
                  {getAppointmentTreatments(appt).length > 0 && (
                    <p className='text-xs text-gray-500 whitespace-normal break-words'>{treatmentsLabel(getAppointmentTreatments(appt))}</p>
                  )}
                </div>
                {isOngoing && (
                  <span className='shrink-0 text-[10px] font-semibold text-white bg-teal-700 px-2 py-0.5 rounded-full'>
                    En transcurso
                  </span>
                )}
                {isPast && (
                  <span className='shrink-0 text-[10px] font-medium text-gray-400'>Finalizado</span>
                )}
                {isUpcoming && (
                  <span className={`shrink-0 flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border
                    ${isUrgent ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-teal-50 text-teal-700 border-teal-200'}`}>
                    <MdOutlineTimer size={10} />
                    {formatCountdown(diffMins)}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
