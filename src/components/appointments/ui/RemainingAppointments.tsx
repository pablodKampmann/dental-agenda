'use client'

import { IoTimeOutline } from 'react-icons/io5';
import { MdOutlineTimer } from 'react-icons/md';
import { timeCalc } from '../appointmentUtils';

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
    <div className='select-none justify-center mt-4 bg-gray-300 bg-opacity-30 text-black border-2 border-gray-600 rounded-lg h-full shadow-xl'>
      <h1 className='text-center justify-center flex bg-teal-600 rounded-t-lg text-white font-semibold text-2xl border-b-2 border-gray-600'>Turnos Restantes</h1>
      <div className='px-2 py-1 bg-white flex border-b border-gray-300'>
        <h1 className='text-left text-medium font-medium'>Hoy ({alwaysToday})</h1>
        <h1 className='ml-auto text-medium font-medium flex'><IoTimeOutline className="mt-0.5 mr-1" size={20} />{time}</h1>
      </div>
      <div className='overflow-y-auto'>
        {todayAppointments.length === 0 ? (
          <p className='text-center text-sm text-gray-500 font-medium py-4 select-none'>No hay turnos agendados para hoy</p>
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
                className={`flex justify-between items-center px-3 py-2 border-b border-gray-300 ${isPast ? 'opacity-40' : ''}`}
              >
                <div className={`flex-col ${isPast ? 'line-through' : ''}`}>
                  <p className='text-xs font-bold'>{appt.time} - {endTime}</p>
                  <p className='text-sm font-semibold'>{appt.patientData?.name} {appt.patientData?.lastName}</p>
                  {appt.reason && <p className='text-xs text-gray-500'>{appt.reason?.name ?? appt.reason}</p>}
                </div>
                {isOngoing && (
                  <span className='text-xs font-bold text-white bg-teal-600 px-2 py-0.5 rounded-full select-none'>En transcurso</span>
                )}
                {isPast && (
                  <span className='text-xs font-medium text-gray-400 select-none'>Finalizado</span>
                )}
                {isUpcoming && (
                  <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold select-none
                    ${isUrgent ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}>
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
