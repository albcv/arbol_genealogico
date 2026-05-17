import { useState } from 'react';
import AsyncSelect from 'react-select/async';
import { getPersonas, getRelatives } from '../api/personas';
import type { Persona } from '../api/personas';

interface Option {
  value: number;
  label: string;
}

const relationOptions = [
  { value: 'padres', label: 'Padres' },
  { value: 'abuelos', label: 'Abuelos' },
  { value: 'bisabuelos', label: 'Bisabuelos' },
  { value: 'tatarabuelos', label: 'Tatarabuelos' },
  { value: 'hermanos', label: 'Hermanos' },
  { value: 'tios', label: 'Tíos' },
  { value: 'primos_hermanos', label: 'Primos hermanos' },
  { value: 'hijos', label: 'Hijos' },
  { value: 'sobrinos', label: 'Sobrinos' },
  { value: 'nietos', label: 'Nietos' },
  { value: 'bisnietos', label: 'Bisnietos' },
  { value: 'tataranietos', label: 'Tataranietos' },
];

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const getFotoUrl = (foto: string | undefined | null): string => {
  if (!foto) return '';
  if (foto.startsWith('http')) return foto;
  const baseSinApp = API_BASE.replace('/app', '');
  return `${baseSinApp}${foto}`;
};

export function Consultas() {
  const [selectedPerson, setSelectedPerson] = useState<Option | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<string>('');
  const [results, setResults] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasQueried, setHasQueried] = useState(false);

  const loadOptions = async (inputValue: string) => {
    try {
      const result = await getPersonas(1, { search: inputValue });
      return (result.results || []).map((p: Persona) => ({
        value: p.id,
        label: `${p.nombre} ${p.apellido1 || ''} ${p.apellido2 || ''}`.trim(),
      }));
    } catch (err) {
      console.error('Error buscando personas:', err);
      return [];
    }
  };

  const handleExecute = async () => {
    if (!selectedPerson) {
      setError('Debe seleccionar una persona');
      return;
    }
    if (!selectedRelation) {
      setError('Debe seleccionar una consulta');
      return;
    }
    setLoading(true);
    setError('');
    setHasQueried(true);
    try {
      const data = await getRelatives(selectedPerson.value, selectedRelation);
      setResults(data);
    } catch (err) {
      console.error('Error ejecutando consulta:', err);
      setError('Error al obtener los familiares');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const renderPersonCard = (p: Persona) => {
    const nombreCompleto = `${p.nombre} ${p.apellido1 || ''} ${p.apellido2 || ''}`.trim();
    const fotoUrl = getFotoUrl(p.foto);
    return (
      <div key={p.id} className="bg-white rounded-xl shadow-md p-4 flex flex-col md:flex-row items-center md:space-x-6">
        {fotoUrl ? (
          <img src={fotoUrl} alt={nombreCompleto} className="w-32 h-32 rounded-full object-cover shadow-md mb-4 md:mb-0" />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-4xl mb-4 md:mb-0">👤</div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{nombreCompleto}</h3>
          <p className="text-gray-800">Sexo: {p.sexo === 'M' ? 'Masculino' : 'Femenino'}</p>
          {p.fecha_nacimiento && <p className="text-gray-800">Nacimiento: {p.fecha_nacimiento}</p>}
          {p.fecha_defuncion && <p className="text-gray-800">Defunción: {p.fecha_defuncion}</p>}
          {p.lugar_nacimiento && <p className="text-gray-800">Lugar nacimiento: {p.lugar_nacimiento}</p>}
          {p.lugar_defuncion && <p className="text-gray-800">Lugar defunción: {p.lugar_defuncion}</p>}
          {p.notas && <p className="text-gray-800 mt-1">Notas: {p.notas}</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-green-200 p-6">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-green-800 mb-6 text-center">Consultas genealógicas</h1>

        <div className="bg-white rounded-xl shadow-xl p-6 mb-8">
          <div className="mb-4">
            <label className="block text-gray-800 font-medium mb-2">Persona:</label>
            <AsyncSelect
              loadOptions={loadOptions}
              onChange={(opt) => setSelectedPerson(opt as Option)}
              placeholder="Buscar persona..."
              isClearable
              className="w-full placeholder-slate-900"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-800 font-medium mb-2">Tipo de consulta:</label>
            <select
              value={selectedRelation}
              onChange={(e) => setSelectedRelation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Seleccione una relación</option>
              {relationOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExecute}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white font-semibold py-2 px-4 rounded-lg hover:from-green-700 hover:to-emerald-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Consultando...' : 'Ejecutar consulta'}
          </button>
          {error && <p className="text-red-600 mt-3 text-center">{error}</p>}
        </div>

        {hasQueried && !loading && results.length === 0 && (
          <div className="bg-white rounded-xl shadow-xl p-6 text-center text-gray-800 font-bold">
            No se encontraron resultados para esta consulta.
          </div>
        )}

        {results.length > 0 && (
          <div className="bg-white rounded-xl shadow-xl p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Resultados ({results.length} persona{results.length !== 1 ? 's' : ''})
            </h2>
            <div className="space-y-4">
              {results.map(p => renderPersonCard(p))}
            </div>
          </div>
        )}

        {!hasQueried && selectedPerson && selectedRelation && !loading && (
          <div className="bg-white rounded-xl shadow-xl p-6 text-center text-gray-700">
            Presiona "Ejecutar consulta" para ver los resultados.
          </div>
        )}
      </div>
    </div>
  );
}