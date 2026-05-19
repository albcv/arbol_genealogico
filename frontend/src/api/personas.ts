import axios from './axios';

export interface Persona {
  id: number;
  nombre: string;
  apellido1: string;
  apellido2: string;
  sexo: string;
  fecha_nacimiento?: string;
  fecha_defuncion?: string;
  lugar_nacimiento?: string;
  lugar_defuncion?: string;
  notas?: string;
  foto?: string;
  padre: number | null;
  madre: number | null;
}

const URL = '/personas/';

export const getPersonas = async (
  page: number = 1,
  filters: {
    search?: string;
    nombre?: string;
    apellido1?: string;
    apellido2?: string;
    year_nacimiento_min?: number;
    year_nacimiento_max?: number;
  } = {}
) => {
  const params = new URLSearchParams({ page: String(page) });
  if (filters.search) params.append('search', filters.search);
  if (filters.nombre) params.append('nombre', filters.nombre);
  if (filters.apellido1) params.append('apellido1', filters.apellido1);
  if (filters.apellido2) params.append('apellido2', filters.apellido2);
  if (filters.year_nacimiento_min) params.append('year_nacimiento_min', String(filters.year_nacimiento_min));
  if (filters.year_nacimiento_max) params.append('year_nacimiento_max', String(filters.year_nacimiento_max));

  const response = await axios.get(`${URL}?${params.toString()}`);
  return response.data; // { count, results }
};

export const searchPersonas = async (input: string): Promise<{ value: number; label: string }[]> => {
  if (!input) return [];
  const data = await getPersonas(1, { search: input });
  return (data.results || []).map((p: Persona) => ({
    value: p.id,
    label: `${p.nombre} ${p.apellido1 || ''} ${p.apellido2 || ''}`.trim(),
  }));
};

export const getPersonaById = async (id: number): Promise<Persona & { padre_nombre?: string; madre_nombre?: string }> => {
  const response = await axios.get(`${URL}${id}/`);
  return response.data;
};

export const createPersona = async (data: FormData | Partial<Persona>): Promise<Persona> => {
  const response = await axios.post(URL, data);
  return response.data;
};

export const updatePersona = async (id: number, data: FormData | Partial<Persona>): Promise<Persona> => {
  const response = await axios.put(`${URL}${id}/`, data);
  return response.data;
};

export const deletePersona = async (id: number): Promise<void> => {
  await axios.delete(`${URL}${id}/`);
};


export const getRelatives = async (id: number, relation: string): Promise<Persona[]> => {
  const response = await axios.get(`${URL}${id}/${relation}/`);
  return response.data;
};

export const getArbolHastaAbuelos = async (id: number): Promise<Persona[]> => {
  const response = await axios.get(`${URL}${id}/arbol-hasta-abuelos/`);
  return response.data; // array de Persona[]
};



export const getPersonasMasculinas = async (search: string = ''): Promise<Persona[]> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const response = await axios.get(`${URL}masculinos/?${params.toString()}`);
  return response.data;
};


export const getPersonasFemeninas = async (search: string = ''): Promise<Persona[]> => {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  const response = await axios.get(`${URL}femeninos/?${params.toString()}`);
  return response.data;
};

// Búsqueda para padre 
export const searchPadre = async (input: string): Promise<{ value: number; label: string }[]> => {
  const data = await getPersonasMasculinas(input);
  return data.map((p: Persona) => ({
    value: p.id,
    label: `${p.nombre} ${p.apellido1 || ''} ${p.apellido2 || ''}`.trim(),
  }));
};

// Búsqueda para madre 
export const searchMadre = async (input: string): Promise<{ value: number; label: string }[]> => {
  const data = await getPersonasFemeninas(input);
  return data.map((p: Persona) => ({
    value: p.id,
    label: `${p.nombre} ${p.apellido1 || ''} ${p.apellido2 || ''}`.trim(),
  }));
};