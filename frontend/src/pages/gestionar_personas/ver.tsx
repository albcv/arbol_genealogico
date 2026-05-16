import { useNavigate } from 'react-router-dom';
import { CrudDetail } from '../../components/CrudDetail';
import { getPersonaById, deletePersona } from '../../api/personas';
import type { Persona } from '../../api/personas';

interface PersonaDetail extends Persona {
  padre_nombre?: string;
  madre_nombre?: string;
  nombre_completo?: string;
}

const fields = [
  { key: 'nombre_completo', label: 'Nombre completo' },
  { key: 'sexo', label: 'Sexo' },
  { key: 'fecha_nacimiento', label: 'Fecha nacimiento' },
  { key: 'fecha_defuncion', label: 'Fecha defunción' },
  { key: 'lugar_nacimiento', label: 'Lugar nacimiento' },
  { key: 'lugar_defuncion', label: 'Lugar defunción' },
  { key: 'notas', label: 'Notas' },
  { key: 'padre_nombre', label: 'Padre' },
  { key: 'madre_nombre', label: 'Madre' },
];

const deleteItemWrapper = async (id: string) => {
  return deletePersona(Number(id));
};

// Función que obtiene y transforma los datos (se ejecuta cada vez que cambia el ID)
const getItemWithDetails = async (id: string): Promise<PersonaDetail> => {
  const data = await getPersonaById(Number(id));
  const nombreCompleto = `${data.nombre} ${data.apellido1 || ''} ${data.apellido2 || ''}`.trim();

  const normalizeId = (parent: any): number | null => {
    if (!parent) return null;
    if (typeof parent === 'object' && parent !== null) return parent.id;
    if (typeof parent === 'number') return parent;
    return null;
  };

  const padreId = normalizeId(data.padre);
  const madreId = normalizeId(data.madre);
  const padreNombre = (data as any).padre_nombre || (padreId ? `ID ${padreId}` : 'No registrado');
  const madreNombre = (data as any).madre_nombre || (madreId ? `ID ${madreId}` : 'No registrado');

  return {
    ...data,
    nombre_completo: nombreCompleto,
    padre_nombre: padreNombre,
    madre_nombre: madreNombre,
    padre: padreId,
    madre: madreId,
  };
};

export function PersonaDetail() {
  const navigate = useNavigate();

  return (
    <CrudDetail
      title="Detalles de la Persona"
      getItem={getItemWithDetails}
      deleteItem={deleteItemWrapper}
      fields={fields}
      basePath="/personas"
      itemName="Persona"
    >
      {({ item }: { item: PersonaDetail }) => {
        const handleVerPadre = () => {
          if (item.padre) navigate(`/personas/ver/${item.padre}`);
        };
        const handleVerMadre = () => {
          if (item.madre) navigate(`/personas/ver/${item.madre}`);
        };

        return (
          <div className="mt-8 pt-4 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Relaciones familiares</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><span className="font-medium">Padre:</span> {item.padre_nombre}</p>
                {item.padre && (
                  <button
                    onClick={handleVerPadre}
                    className="text-blue-600 hover:underline text-sm focus:outline-none"
                  >
                    Ver datos del padre
                  </button>
                )}
              </div>
              <div>
                <p><span className="font-medium">Madre:</span> {item.madre_nombre}</p>
                {item.madre && (
                  <button
                    onClick={handleVerMadre}
                    className="text-blue-600 hover:underline text-sm focus:outline-none"
                  >
                    Ver datos de la madre
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6">
              <p className="font-medium mb-2">Foto:</p>
              {item.foto ? (
                <img
                  src={item.foto}
                  alt={item.nombre_completo}
                  className="max-w-xs rounded shadow"
                />
              ) : (
                <p className="text-gray-500 italic">No hay foto disponible</p>
              )}
            </div>
          </div>
        );
      }}
    </CrudDetail>
  );
}