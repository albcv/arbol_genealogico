import axios from './axios';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email?: string;
  password: string;
  [key: string]: any;
}

export const fetchCsrfCookie = async (): Promise<void> => {
  await axios.get('/csrf/');
};

export const loginUser = async (username: string, password: string) => {
  const response = await axios.post('/login/', { username, password });
  return response.data; // { user: {...} }
};


export const logoutUser = async (): Promise<void> => {
  await axios.post('/logout/');
};

export const getPerfil = async () => {
  const response = await axios.get('/perfil/');
  return response.data;
};

export const cambiarPassword = async (current_password: string, new_password: string) => {
  const response = await axios.post('/cambiar-password/', { current_password, new_password });
  return response.data;
};