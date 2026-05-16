import { useForm, Controller, useWatch } from 'react-hook-form';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import { AxiosError } from 'axios';

// Definición de tipos para los campos del formulario
interface FieldOption {
  value: string | number;
  label: string;
}

export interface Field {
  name: string;
  label: string;
  type: 'text' | 'select' | 'autoselect' | 'textarea' | 'date' | 'number' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: FieldOption[];
  loadOptions?: (input: string) => Promise<FieldOption[]>;
  step?: string;
  accept?: string; // para campos file
}

interface CrudFormProps {
  title: string;
  fields: Field[];
  getItem: (id: string) => Promise<any>;
  createItem: (data: any) => Promise<any>;
  updateItem: (id: string, data: any) => Promise<any>;
  deleteItem?: (id: string) => Promise<any>;
  basePath: string;
  itemName: string;
  initialData?: any;
  children?: React.ReactNode | ((props: { item: any; isEditing: boolean }) => React.ReactNode);
}

export function CrudForm({
  title,
  fields,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  basePath,
  itemName,
  initialData = null,
  children,
}: CrudFormProps) {
  const { register, handleSubmit, formState: { errors }, reset, control } = useForm();
  const navigate = useNavigate();
  const params = useParams();
  const isEditing = !!params.id;
  const formValues = useWatch({ control });

  useEffect(() => {
    if (isEditing) {
      loadItem();
    } else if (initialData) {
      reset(initialData);
    }
  }, []);

  const loadItem = async () => {
    try {
      const data = await getItem(params.id!);
      reset(data);
    } catch (error) {
      console.error(`Error cargando ${itemName}:`, error);
      toast.error(`Error al cargar datos`);
    }
  };

  const onSubmit = handleSubmit(async (data) => {
    const processedData = { ...data };

    fields.forEach(field => {
      const value = data[field.name];
      if (field.type === 'autoselect') {
        if (value && typeof value === 'object' && 'value' in value) {
          processedData[field.name] = value.value;
        } else {
          processedData[field.name] = value;
        }
      } else if (field.type === 'number' && !field.required) {
        if (value === '' || value === null || value === undefined) {
          processedData[field.name] = null;
        } else {
          const num = Number(value);
          processedData[field.name] = isNaN(num) ? null : num;
        }
      } else if (field.type === 'select' && !field.required && value === '') {
        processedData[field.name] = null;
      }
    });

    fields.forEach(field => {
      const value = processedData[field.name];
      if (!field.required && typeof value === 'string' && value.trim() === '') {
        processedData[field.name] = null;
      }
    });

    // Limpiar cadenas vacías que no deberían ir al backend
    Object.keys(processedData).forEach(key => {
      if (processedData[key] === '') processedData[key] = null;
    });

    try {
      if (isEditing) {
        console.log(`📤 Enviando actualización de ${itemName} (ID: ${params.id!}):`, processedData);
        await updateItem(params.id!, processedData);
        toast.success(`${itemName} actualizado correctamente`);
      } else {
        console.log(`📤 Enviando creación de ${itemName}:`, processedData);
        await createItem(processedData);
        toast.success(`${itemName} creado correctamente`);
      }
      navigate(basePath);
    } catch (err: unknown) {
      console.error(`Error guardando ${itemName}:`, err);
      const error = err as AxiosError;
      if (error.response && error.response.data) {
        const errorData = error.response.data as any;
        console.error('📋 Detalles completos del error:', errorData);
        
        let errorMessage = 'Error al guardar';
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (Array.isArray(errorData)) {
          errorMessage = errorData.join(', ');
        } else if (typeof errorData === 'object') {
          const allErrors = Object.entries(errorData).map(([field, msgs]) => {
            const msgArray = Array.isArray(msgs) ? msgs : [msgs];
            return `${field}: ${msgArray.join(', ')}`;
          }).join('; ');
          if (allErrors) errorMessage = allErrors;
        }
        
        toast.error(errorMessage, { duration: 5000 });
      } else {
        toast.error('Error al guardar (sin respuesta del servidor)');
      }
    }
  });

  const handleDelete = async () => {
    if (window.confirm(`¿Está seguro de eliminar este ${itemName}?`)) {
      try {
        await deleteItem!(params.id!);
        toast.success(`${itemName} eliminado correctamente`);
        navigate(basePath);
      } catch (error) {
        console.error(`Error eliminando ${itemName}:`, error);
        toast.error(`Error al eliminar`);
      }
    }
  };

  // Renderizado de children (puede ser función)
  const renderChildren = () => {
    if (typeof children === 'function') {
      return children({ item: formValues, isEditing });
    }
    return children;
  };

  return (
    <div className="min-h-screen bg-green-200 p-6">
      <div className="container mx-auto max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-800 to-green-600 p-6">
            <h1 className="text-3xl font-bold text-white">{title}</h1>
          </div>
          <div className="p-8">
            <form onSubmit={onSubmit} className="space-y-6">
              {fields.map(field => (
                <div key={field.name}>
                  <label className="block text-gray-700 text-sm font-medium mb-2">
                    {field.label}
                  </label>
                  {field.type === 'autoselect' ? (
                    field.loadOptions ? (
                      <Controller
                        name={field.name}
                        control={control}
                        rules={{ required: field.required }}
                        render={({ field: { onChange, value } }) => (
                          <AsyncSelect
                            loadOptions={field.loadOptions!}
                            defaultOptions
                            placeholder={field.placeholder || "Buscar..."}
                            isClearable
                            isSearchable
                            noOptionsMessage={() => "No se encontraron resultados"}
                            onChange={(selected) => onChange(selected ? selected : null)}
                            value={value}
                            getOptionValue={(option) => String(option.value)}
                            getOptionLabel={(option) => option.label}
                            classNamePrefix="react-select"
                          />
                        )}
                      />
                    ) : (
                      <Controller
                        name={field.name}
                        control={control}
                        rules={{ required: field.required }}
                        render={({ field: { onChange, value } }) => (
                          <Select
                            options={field.options}
                            placeholder={field.placeholder || "Buscar..."}
                            isClearable
                            isSearchable
                            noOptionsMessage={() => "No se encontraron resultados"}
                            onChange={(selected) => onChange(selected ? selected.value : null)}
                            value={field.options?.find(opt => opt.value === value) || null}
                            classNamePrefix="react-select"
                          />
                        )}
                      />
                    )
                  ) : field.type === 'select' ? (
                    <select
                      {...register(field.name, { required: field.required })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Seleccione...</option>
                      {field.options?.map(opt => (
                        <option key={String(opt.value)} value={String(opt.value)}>{opt.label}</option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      {...register(field.name, { required: field.required })}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      rows={4}
                    />
                  ) : field.type === 'file' ? (
                    <input
                      type="file"
                      accept={field.accept || '*'}
                      {...register(field.name, { required: field.required })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      step={field.step || (field.type === 'number' ? 'any' : undefined)}
                      {...register(field.name, { required: field.required })}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  )}
                  {errors[field.name] && (
                    <span className="text-red-600 text-sm mt-1">Este campo es requerido</span>
                  )}
                </div>
              ))}

              {renderChildren()}

              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={() => navigate(basePath)}
                  className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <div className="space-x-3">
                  {isEditing && typeof deleteItem === 'function' && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-red-600 text-white rounded-lg hover:from-yellow-700 hover:to-red-700 transition-all"
                  >
                    {isEditing ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}