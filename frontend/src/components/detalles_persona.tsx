import { useState, useEffect } from 'react';
import type { Persona } from '../api/personas';
import { getPersonaById } from '../api/personas';

interface DetallesPersonaProps {
    persona: Persona | null;
    onClose: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const getFotoUrl = (foto: string | undefined | null): string => {
    if (!foto) return '';
    if (foto.startsWith('http')) return foto;
    const baseSinApp = API_BASE.replace('/app', '');
    return `${baseSinApp}${foto}`;
};

export function DetallesPersona({ persona, onClose }: DetallesPersonaProps) {
    const [padreNombre, setPadreNombre] = useState<string | null>(null);
    const [madreNombre, setMadreNombre] = useState<string | null>(null);

    useEffect(() => {
        if (!persona) return;

        const fetchParentNames = async () => {
            if (persona.padre) {
                try {
                    const padre = await getPersonaById(persona.padre);
                    const nombreCompleto = `${padre.nombre} ${padre.apellido1 || ''} ${padre.apellido2 || ''}`.trim();
                    setPadreNombre(nombreCompleto);
                } catch {
                    setPadreNombre(`ID ${persona.padre}`);
                }
            }
            if (persona.madre) {
                try {
                    const madre = await getPersonaById(persona.madre);
                    const nombreCompleto = `${madre.nombre} ${madre.apellido1 || ''} ${madre.apellido2 || ''}`.trim();
                    setMadreNombre(nombreCompleto);
                } catch {
                    setMadreNombre(`ID ${persona.madre}`);
                }
            }
        };
        fetchParentNames();
    }, [persona]);

    if (!persona) return null;

    const nombreCompleto = `${persona.nombre} ${persona.apellido1 || ''} ${persona.apellido2 || ''}`.trim();
    const fotoUrl = getFotoUrl(persona.foto);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Cabecera con botón cerrar */}
                <div className="sticky top-0 bg-gradient-to-r from-green-800 to-green-600 p-4 rounded-t-2xl flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-white">Detalles de la persona</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 text-3xl leading-none focus:outline-none"
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6">
                    {/* Foto grande */}
                    <div className="flex justify-center mb-6">
                        {fotoUrl ? (
                            <img
                                src={fotoUrl}
                                alt={nombreCompleto}
                                className="w-80 h-80 rounded-full object-cover shadow-lg border-8 border-green-100"
                            />
                        ) : (
                            <div className="w-80 h-80 rounded-full bg-gray-200 flex items-center justify-center text-8xl shadow-lg border-8 border-green-100">
                                👤
                            </div>
                        )}
                    </div>

                    {/* Información detallada */}
                    <div className="space-y-3">
                        <div className="border-b border-gray-200 pb-2">
                            <p className="text-sm text-gray-700">Nombre completo</p>
                            <p className="text-lg font-semibold">{nombreCompleto}</p>
                        </div>
                        <div className="border-b border-gray-200 pb-2">
                            <p className="text-sm text-gray-700">Sexo</p>
                            <p className="text-lg">{persona.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
                        </div>
                        {persona.fecha_nacimiento && (
                            <div className="border-b border-gray-200 pb-2">
                                <p className="text-sm text-gray-700">Fecha de nacimiento</p>
                                <p className="text-lg">{persona.fecha_nacimiento}</p>
                            </div>
                        )}
                        {persona.fecha_defuncion && (
                            <div className="border-b border-gray-200 pb-2">
                                <p className="text-sm text-gray-700">Fecha de defunción</p>
                                <p className="text-lg">{persona.fecha_defuncion}</p>
                            </div>
                        )}
                        {persona.lugar_nacimiento && (
                            <div className="border-b border-gray-200 pb-2">
                                <p className="text-sm text-gray-700">Lugar de nacimiento</p>
                                <p className="text-lg">{persona.lugar_nacimiento}</p>
                            </div>
                        )}
                        {persona.lugar_defuncion && (
                            <div className="border-b border-gray-200 pb-2">
                                <p className="text-sm text-gray-700">Lugar de defunción</p>
                                <p className="text-lg">{persona.lugar_defuncion}</p>
                            </div>
                        )}
                        {persona.notas && (
                            <div className="border-b border-gray-200 pb-2">
                                <p className="text-sm text-gray-700">Notas</p>
                                <p className="text-lg whitespace-pre-wrap">{persona.notas}</p>
                            </div>
                        )}
                        {persona.padre && (
                            <div className="border-b border-gray-200 pb-2">
                                <p className="text-sm text-gray-700">Padre</p>
                                <p className="text-lg">{padreNombre || 'Cargando...'}</p>
                            </div>
                        )}
                        {persona.madre && (
                            <div className="border-b border-gray-200 pb-2">
                                <p className="text-sm text-gray-700">Madre</p>
                                <p className="text-lg">{madreNombre || 'Cargando...'}</p>
                            </div>
                        )}
                    </div>

                    {/* Botón cerrar adicional */}
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}