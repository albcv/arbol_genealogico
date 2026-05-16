import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

interface Field {
  key: string;
  label: string;
}

interface CrudDetailProps {
  title: string;
  getItem: (id: string) => Promise<any>;
  deleteItem: (id: string) => Promise<any>;
  fields: Field[];
  basePath: string;
  itemName: string;
  children?: React.ReactNode | ((props: { item: any }) => React.ReactNode);
}

export function CrudDetail({
  title,
  getItem,
  deleteItem,
  fields,
  basePath,
  itemName,
  children,
}: CrudDetailProps) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { id } = useParams();

  // ✅ Recargar cuando cambia el ID
  useEffect(() => {
    loadItem();
  }, [id]);

  const loadItem = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getItem(id);
      setItem(data);
    } catch (error) {
      console.error(`Error cargando ${itemName}:`, error);
      toast.error(`Error al cargar detalles`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Está seguro de eliminar este ${itemName}?`)) {
      try {
        await deleteItem(id!);
        toast.success(`${itemName} eliminado correctamente`);
        navigate(basePath);
      } catch (error) {
        console.error(`Error eliminando ${itemName}:`, error);
        toast.error(`Error al eliminar`);
      }
    }
  };

  if (loading) return <div className="text-center py-12">Cargando...</div>;
  if (!item) return <div className="text-center py-12">No se encontró el {itemName}</div>;

  return (
    <div className="min-h-screen bg-green-200 p-6">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Cabecera */}
          <div className="bg-gradient-to-r from-green-800 to-green-600 p-6 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <button
              onClick={() => navigate(basePath)}
              className="px-4 py-2 bg-white text-green-800 rounded-lg hover:bg-gray-100 transition-colors"
            >
              ← Volver
            </button>
          </div>

          {/* Detalles */}
          <div className="p-8">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map(field => {
                const value = item[field.key];
                const isEmpty = !value || (typeof value === 'string' && value.trim() === '');
                const displayValue = isEmpty ? 'No hay información' : value;
                return (
                  <div key={field.key} className="border-b border-gray-200 pb-3">
                    <dt className="text-sm font-medium text-gray-500">{field.label}</dt>
                    <dd
                      className={`mt-1 ${
                        isEmpty ? 'text-red-500 text-sm' : 'text-gray-900 text-lg'
                      }`}
                    >
                      {displayValue}
                    </dd>
                  </div>
                );
              })}
            </dl>

            {/* Contenido adicional */}
            {typeof children === 'function' ? children({ item }) : children}

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 mt-8 pt-4 border-t border-gray-200">
              <button
                onClick={() => navigate(`${basePath}/editar/${id}`)}
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}