import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import verImg from '../img/ver.jpg';
import editarImg from '../img/editar.jpg';
import eliminarImg from '../img/eliminar.jpg';

const VerIcon = () => <img src={verImg} alt="ver" className="w-5 h-5" />;
const EditarIcon = () => <img src={editarImg} alt="editar" className="w-5 h-5" />;
const EliminarIcon = () => <img src={eliminarImg} alt="eliminar" className="w-5 h-5" />;

interface Column {
  key: string;
  label: string;
  render?: (value: any, item: any) => React.ReactNode;
}

interface CrudIndexProps {
  title: string;
  items: any[];
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSearch: (term: string) => void;
  searchTerm: string;
  deleteItem: (id: number) => Promise<any>;
  bulkDeleteItems?: (ids: number[]) => Promise<any>; // nueva prop
  onRefresh: () => void;
  columns: Column[];
  basePath: string;
  itemName: string;
  totalCount?: number;
  loading: boolean;
}

export function CrudIndex({
  title,
  items,
  totalPages,
  currentPage,
  onPageChange,
  onSearch,
  searchTerm,
  deleteItem,
  bulkDeleteItems,
  onRefresh,
  columns,
  basePath,
  itemName,
  totalCount,
  loading,
}: CrudIndexProps) {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState<string>(searchTerm || '');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    setInputValue(searchTerm || '');
  }, [searchTerm]);

  const handleSearchClick = () => {
    onSearch(inputValue);
  };

  const handleClear = () => {
    setInputValue('');
    onSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm(`¿Está seguro de eliminar este ${itemName}?`)) {
      try {
        await deleteItem(id);
        toast.success(`${itemName} eliminado correctamente`);
        onRefresh();
      } catch (error) {
        console.error(`Error eliminando ${itemName}:`, error);
        toast.error(`Error al eliminar ${itemName}`);
      }
    }
  };

  // Eliminación masiva
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`¿Está seguro de eliminar ${selectedIds.size} ${itemName}(s) seleccionados?`)) {
      try {
        if (bulkDeleteItems) {
          await bulkDeleteItems(Array.from(selectedIds));
        } else {
          // Fallback: eliminar uno por uno en paralelo
          await Promise.all(Array.from(selectedIds).map(id => deleteItem(id)));
        }
        toast.success(`${selectedIds.size} ${itemName}(s) eliminado(s) correctamente`);
        setSelectedIds(new Set());
        onRefresh();
      } catch (error) {
        console.error(`Error eliminando ${itemName}s:`, error);
        toast.error(`Error al eliminar los ${itemName}s seleccionados`);
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const getPageNumbers = (): (number | string)[] => {
    const delta = 2;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    range.forEach((i) => {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    });

    return rangeWithDots;
  };

  if (loading) {
    return (
      <div className="bg-green-200 min-h-screen flex flex-col items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-24 w-24 border-8 border-green-600 border-t-transparent"></div>
        <p className="mt-6 text-3xl font-bold text-gray-900">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-200 p-6">
      <div className="container mx-auto">
        {/* Cabecera */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">{title}</h1>
          <button
            onClick={() => navigate(`${basePath}/crear`)}
            className="bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all transform hover:-translate-y-0.5"
          >
            + Crear {itemName}
          </button>
        </div>

        {/* Barra de búsqueda y botón de eliminación masiva */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 min-w-[250px] gap-2">
            <input
              type="text"
              placeholder="Buscar..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-600"
            />
            {inputValue && (
              <button
                onClick={handleClear}
                className="px-4 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                title="Limpiar filtro"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              onClick={handleSearchClick}
              className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Buscar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          <div className="flex items-center gap-4">
            {selectedIds.size > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar seleccionados ({selectedIds.size})
              </button>
            )}
            <div className="text-gray-800 font-medium bg-white px-4 py-2 rounded-lg shadow">
              {items.length} {items.length === 1 ? 'registro' : 'registros'} mostrados
              {totalCount !== undefined && items.length !== totalCount && (
                <span className="text-gray-700 text-sm ml-1">
                  (de {totalCount} total)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-xl overflow-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-green-800 to-green-600 text-white">
              <tr>
                <th className="px-6 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === items.length && items.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                {columns.map(col => (
                  <th key={col.key} className="px-6 py-3 text-left">{col.label}</th>
                ))}
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-green-50">
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  {columns.map(col => (
                    <td key={col.key} className="px-6 py-4 text-gray-800">
                      {col.render ? col.render(item[col.key], item) : item[col.key]}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={() => navigate(`${basePath}/ver/${item.id}`)}
                        className="hover:scale-110 transition-transform"
                        title="Ver detalles"
                      >
                        <VerIcon />
                      </button>
                      <button
                        onClick={() => navigate(`${basePath}/editar/${item.id}`)}
                        className="hover:scale-110 transition-transform"
                        title="Editar"
                      >
                        <EditarIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="hover:scale-110 transition-transform"
                        title="Eliminar"
                      >
                        <EliminarIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 px-6 py-4 bg-gray-50">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Anterior
              </button>
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' ? onPageChange(page) : null}
                  disabled={page === '...'}
                  className={`px-3 py-1 rounded border transition-colors ${
                    page === currentPage
                      ? 'bg-green-600 text-white border-green-600'
                      : page === '...'
                      ? 'cursor-default border-transparent'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border disabled:opacity-50 hover:bg-gray-100 transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {items.length === 0 && !loading && (
          <div className="text-center py-12 text-black">
            No se encontraron resultados
          </div>
        )}
      </div>
    </div>
  );
}