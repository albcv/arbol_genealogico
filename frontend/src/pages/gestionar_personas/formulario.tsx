import { useParams } from 'react-router-dom';
import { CrudForm } from '../../components/CrudForm';
import type { Field } from '../../components/CrudForm';
import {
  getPersonaById,
  createPersona,
  updatePersona,
  deletePersona,
  searchPadre,   
  searchMadre,
} from '../../api/personas';

const sexoOptions = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
];

const fields: Field[] = [
  { name: 'nombre', label: 'Nombre', type: 'text', required: true, placeholder: 'Nombre' },
  { name: 'apellido1', label: 'Primer apellido', type: 'text', required: false, placeholder: 'Primer apellido' },
  { name: 'apellido2', label: 'Segundo apellido', type: 'text', required: false, placeholder: 'Segundo apellido' },
  { name: 'sexo', label: 'Sexo', type: 'select', required: true, options: sexoOptions },
  { name: 'fecha_nacimiento', label: 'Fecha nacimiento', type: 'date', required: false },
  { name: 'fecha_defuncion', label: 'Fecha defunción', type: 'date', required: false },
  { name: 'lugar_nacimiento', label: 'Lugar nacimiento', type: 'text', required: false, placeholder: 'Ciudad, país' },
  { name: 'lugar_defuncion', label: 'Lugar defunción', type: 'text', required: false, placeholder: 'Ciudad, país' },
  { name: 'notas', label: 'Notas', type: 'textarea', required: false, placeholder: 'Biografía, notas adicionales' },
  { name: 'foto', label: 'Foto', type: 'file', required: false, accept: 'image/*' },
  {
    name: 'padre',
    label: 'Padre',
    type: 'autoselect',
    required: false,
    loadOptions: searchPadre, 
    placeholder: 'Buscar persona...',
  },
  {
    name: 'madre',
    label: 'Madre',
    type: 'autoselect',
    required: false,
    loadOptions: searchMadre,
    placeholder: 'Buscar persona...',
  },
];

// Convierte el objeto de autoselect a ID numérico o null
const normalizeParent = (value: any): number | null => {
  if (!value) return null;
  if (typeof value === 'object' && 'value' in value) return value.value;
  if (typeof value === 'number') return value;
  return null;
};

// Extrae el archivo de un FileList o File
const getFileFromInput = (value: any): File | null => {
  if (!value) return null;
  if (value instanceof File) return value;
  if (value instanceof FileList && value.length > 0) return value[0];
  return null;
};

// Obtiene los datos para edición
const getItemForForm = async (id: string) => {
  const data = await getPersonaById(Number(id));
  const result: any = { ...data };

  if (data.padre) {
    const padreId = typeof data.padre === 'object' ? (data.padre as any).id : data.padre;
    try {
      const padreData = await getPersonaById(padreId);
      result.padre = {
        value: padreData.id,
        label: `${padreData.nombre} ${padreData.apellido1 || ''} ${padreData.apellido2 || ''}`.trim(),
      };
    } catch {
      result.padre = { value: padreId, label: `ID ${padreId}` };
    }
  } else {
    result.padre = null;
  }

  if (data.madre) {
    const madreId = typeof data.madre === 'object' ? (data.madre as any).id : data.madre;
    try {
      const madreData = await getPersonaById(madreId);
      result.madre = {
        value: madreData.id,
        label: `${madreData.nombre} ${madreData.apellido1 || ''} ${madreData.apellido2 || ''}`.trim(),
      };
    } catch {
      result.madre = { value: madreId, label: `ID ${madreId}` };
    }
  } else {
    result.madre = null;
  }

  result.foto_url = data.foto;
  result.foto = null;
  return result;
};

// Wrapper para creación
const createItemWrapper = async (data: any) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (key === 'padre' || key === 'madre') {
      const value = normalizeParent(data[key]);
      if (value !== null) formData.append(key, String(value));
    } else if (key === 'foto') {
      const file = getFileFromInput(data[key]);
      if (file) formData.append('foto', file);
    } else if (key !== 'foto_url' && data[key] !== undefined && data[key] !== null) {
      formData.append(key, String(data[key]));
    }
  });
  return createPersona(formData);
};

// Wrapper para actualización
const updateItemWrapper = async (id: string, data: any) => {
  const formData = new FormData();
  Object.keys(data).forEach(key => {
    if (key === 'padre' || key === 'madre') {
      const value = normalizeParent(data[key]);
      if (value !== null) formData.append(key, String(value));
    } else if (key === 'foto') {
      const file = getFileFromInput(data[key]);
      if (file) formData.append('foto', file);
    } else if (key !== 'foto_url' && data[key] !== undefined && data[key] !== null) {
      formData.append(key, String(data[key]));
    }
  });
  return updatePersona(Number(id), formData);
};

const deleteItemWrapper = async (id: string) => {
  return deletePersona(Number(id));
};

export function PersonaForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const title = isEditing ? 'Editar Persona' : 'Crear Persona';

  return (
    <CrudForm
      title={title}
      fields={fields}
      getItem={getItemForForm}
      createItem={createItemWrapper}
      updateItem={updateItemWrapper}
      deleteItem={deleteItemWrapper}
      basePath="/personas"
      itemName="Persona"
    >
      {({ item, isEditing }) => isEditing && item?.foto_url && (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">Foto actual</label>
          <img src={item.foto_url} alt="Foto actual" className="w-32 h-32 object-cover rounded shadow" />
        </div>
      )}
    </CrudForm>
  );
}