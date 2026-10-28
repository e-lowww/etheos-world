// Dirección del backend. En local es el puerto 3000; al publicar, pon la URL de Render
// en un archivo .env del frontend:  VITE_API_URL=https://tu-backend.onrender.com
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const CLAVE_TOKEN = 'etheosToken';
export const getToken = () => sessionStorage.getItem(CLAVE_TOKEN);
export const setToken = (t) => sessionStorage.setItem(CLAVE_TOKEN, t);
export const quitarToken = () => sessionStorage.removeItem(CLAVE_TOKEN);

// Petición protegida: manda el token del admin. Si expiró, lanza 'Sesión expirada'.
export async function peticionAdmin(ruta, opciones = {}) {
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
    headers: { ...(opciones.headers || {}), Authorization: `Bearer ${getToken()}` }
  });
  if (respuesta.status === 401) throw new Error('Sesión expirada');
  return respuesta.json();
}
