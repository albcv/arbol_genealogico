import { useState, useEffect } from 'react';
import { CrudIndex } from '../../components/CrudIndex';
import { getPersonas, deletePersona } from '../../api/personas';
import type { Persona } from '../../api/personas';

interface PersonaConNombreCompleto extends Persona {
  nombre_completo: string;
}

const columns = [
  { key: 'nombre_completo', label: 'Nombre completo' },
  { key: 'sexo', label: 'Sexo' },
  { key: 'fecha_nacimiento', label: 'Fecha nacimiento' },
  {
    key: 'foto',
    label: 'Foto',
    render: (value: string) => {
      if (!value) return <span className="text-gray-400 italic">Sin foto</span>;
      return (
        <img
          src={value}
          alt="Foto"
          className="w-16 h-16 rounded-full object-cover shadow-md"
        />
      );
    }
  },
];

export function PersonasIndex() {
  const [data, setData] = useState<PersonaConNombreCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para filtros adicionales
  const [filters, setFilters] = useState({
    nombre: '',
    apellido1: '',
    apellido2: '',
    year_nacimiento_min: '',
    year_nacimiento_max: '',
  });

  // Función para construir objeto de filtros
  const getFilterParams = () => {
    const params: any = { search: searchTerm };
    if (filters.nombre) params.nombre = filters.nombre;
    if (filters.apellido1) params.apellido1 = filters.apellido1;
    if (filters.apellido2) params.apellido2 = filters.apellido2;
    if (filters.year_nacimiento_min) params.year_nacimiento_min = parseInt(filters.year_nacimiento_min);
    if (filters.year_nacimiento_max) params.year_nacimiento_max = parseInt(filters.year_nacimiento_max);
    return params;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getPersonas(currentPage, getFilterParams());
      const transformedResults = (result.results || []).map((p: Persona) => ({
        ...p,
        nombre_completo: `${p.nombre} ${p.apellido1 || ''} ${p.apellido2 || ''}`.trim(),
      }));
      setData(transformedResults);
      setTotalCount(result.count || 0);
      const PAGE_SIZE = 100;
      setTotalPages(Math.ceil((result.count || 0) / PAGE_SIZE));
    } catch (error) {
      console.error('Error cargando personas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchTerm, filters]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      nombre: '',
      apellido1: '',
      apellido2: '',
      year_nacimiento_min: '',
      year_nacimiento_max: '',
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-green-200 p-6">
      <div className="container mx-auto">
        {/* Panel de filtros adicionales */}
        <div className="bg-white p-4 rounded-xl shadow-xl mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Filtros avanzados</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              name="nombre"
              value={filters.nombre}
              onChange={handleFilterChange}
              placeholder="Nombre"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 placeholder-slate-600"
            />
            <input
              type="text"
              name="apellido1"
              value={filters.apellido1}
              onChange={handleFilterChange}
              placeholder="Primer apellido"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 placeholder-slate-600"
            />
            <input
              type="text"
              name="apellido2"
              value={filters.apellido2}
              onChange={handleFilterChange}
              placeholder="Segundo apellido"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 placeholder-slate-600"
            />
            <input
              type="number"
              name="year_nacimiento_min"
              value={filters.year_nacimiento_min}
              onChange={handleFilterChange}
              placeholder="Año nacimiento (desde)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 placeholder-slate-600"
            />
            <input
              type="number"
              name="year_nacimiento_max"
              value={filters.year_nacimiento_max}
              onChange={handleFilterChange}
              placeholder="Año nacimiento (hasta)"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 placeholder-slate-600"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <CrudIndex
          title="Gestionar Personas"
          items={data}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onSearch={handleSearch}
          searchTerm={searchTerm}
          deleteItem={deletePersona}
          onRefresh={handleRefresh}
          columns={columns}
          basePath="/personas"
          itemName="Persona"
          totalCount={totalCount}
          loading={loading}
        />
      </div>
    </div>
  );
}