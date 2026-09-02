'use client'

import React, { useState, useEffect } from 'react';
import { getPatientAppointments } from '@/services/appointments/getPatientAppointments';
import { ClipLoader } from 'react-spinners';
import { BsCalendarCheck, BsCalendarX } from 'react-icons/bs';

function parseApptDate(dateStr: string): Date {
    const [d, m, y] = dateStr.split('/');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
}

interface AppointmentsSummaryProps {
    patientId: string;
}

export function AppointmentsSummary({ patientId }: AppointmentsSummaryProps) {
    const [appointments, setAppointments] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!patientId) return;
        setLoading(true);
        getPatientAppointments(patientId).then(appts => {
            setAppointments(appts);
            setLoading(false);
        });
    }, [patientId]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedAppointments = [...(appointments || [])].sort(
        (a, b) => parseApptDate(a.date).getTime() - parseApptDate(b.date).getTime()
    );
    const nextAppointment = sortedAppointments.find(a => parseApptDate(a.date) >= today) ?? null;
    const lastAppointment = [...sortedAppointments].reverse().find(a => parseApptDate(a.date) < today) ?? null;

    return (
        <div className="border-2 border-gray-300 rounded-xl overflow-hidden mt-4 mb-4">
            <div className="flex divide-x divide-gray-200">
                {/* Last visit */}
                <div className="flex-1 px-4 py-3 bg-gray-50">
                    <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1.5 flex items-center gap-1.5">
                        <BsCalendarX size={13} /> Última Visita
                    </h3>
                    {loading ? (
                        <ClipLoader size={14} color="#9ca3af" />
                    ) : lastAppointment ? (
                        <>
                            <p className="text-sm font-semibold text-black">
                                {lastAppointment.dayComplete} · {lastAppointment.time}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {typeof lastAppointment.reason === 'string'
                                    ? lastAppointment.reason
                                    : lastAppointment.reason?.name || 'Sin motivo registrado'}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Sin visitas anteriores</p>
                    )}
                </div>
                {/* Next appointment */}
                <div className="flex-1 px-4 py-3">
                    <h3 className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-1.5 flex items-center gap-1.5">
                        <BsCalendarCheck size={13} /> Próximo Turno
                    </h3>
                    {loading ? (
                        <ClipLoader size={14} color="#9ca3af" />
                    ) : nextAppointment ? (
                        <>
                            <p className="text-sm font-semibold text-teal-700">
                                {nextAppointment.dayComplete} · {nextAppointment.time}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {typeof nextAppointment.reason === 'string'
                                    ? nextAppointment.reason
                                    : nextAppointment.reason?.name || 'Sin motivo registrado'}
                            </p>
                        </>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Sin próximo turno</p>
                    )}
                </div>
            </div>
        </div>
    );
}
