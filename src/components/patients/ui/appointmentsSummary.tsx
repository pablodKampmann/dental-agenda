'use client'

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { getPatientAppointments } from '@/services/appointments/getPatientAppointments';
import { ClipLoader } from 'react-spinners';
import { BsCalendarCheck, BsCalendarX } from 'react-icons/bs';
import { getAppointmentTreatments, treatmentsLabel, timeCalc } from '@/components/appointments/appointmentUtils';

function parseApptDate(dateStr: string): Date {
    const [d, m, y] = dateStr.split('/');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
}

function timeRange(appt: any): string {
    const slots = [appt.time, appt.time2, appt.time3, appt.time4, appt.time5, appt.time6].filter(Boolean);
    return `${appt.time} - ${timeCalc(slots[slots.length - 1])}`;
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

    const contentRef = useRef<HTMLDivElement>(null);
    const prevHeightRef = useRef<number | null>(null);
    const [height, setHeight] = useState<number | 'auto'>('auto');
    const [isAnimating, setIsAnimating] = useState(false);

    const prevLoadingRef = useRef(loading);
    if (prevLoadingRef.current !== loading) {
        prevHeightRef.current = contentRef.current?.scrollHeight ?? null;
        prevLoadingRef.current = loading;
    }

    useLayoutEffect(() => {
        const el = contentRef.current;
        if (!el) return;
        const newHeight = el.scrollHeight;

        if (prevHeightRef.current == null || prevHeightRef.current === newHeight) {
            setHeight('auto');
            setIsAnimating(false);
            prevHeightRef.current = null;
            return;
        }

        setIsAnimating(false);
        setHeight(prevHeightRef.current);
        prevHeightRef.current = null;

        requestAnimationFrame(() => {
            setIsAnimating(true);
            setHeight(newHeight);
        });
    }, [loading]);

    function handleTransitionEnd(event: React.TransitionEvent) {
        if (event.propertyName !== 'height' || event.target !== event.currentTarget) return;
        setHeight('auto');
        setIsAnimating(false);
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mt-4 mb-4">
            <div
                className={`duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${isAnimating ? 'transition-[height] overflow-hidden' : 'overflow-visible'}`}
                style={{ height }}
                onTransitionEnd={handleTransitionEnd}
            >
                <div ref={contentRef} className={`flex divide-x divide-gray-200 ${height !== 'auto' ? 'opacity-0' : 'animate-fade-in'}`}>
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
                                    {lastAppointment.dayComplete} · {timeRange(lastAppointment)}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {treatmentsLabel(getAppointmentTreatments(lastAppointment)) || 'Sin tratamiento registrado'}
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
                                    {nextAppointment.dayComplete} · {timeRange(nextAppointment)}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {treatmentsLabel(getAppointmentTreatments(nextAppointment)) || 'Sin tratamiento registrado'}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-gray-400 italic">Sin próximo turno</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
