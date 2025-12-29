// Definimos la URL base de tu API (Backend NestJS)
// Cuando subas a producción, solo cambias esta variable de entorno.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const ApiRoutes = {

  //General
  healthCheck: `${API_BASE_URL}`,
 
  // Autenticación
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
  },
  
  // Pacientes
  pacientes: {
    base: `${API_BASE_URL}/pacientes`, // GET (todos), POST (crear)
    byId: (id: string) => `${API_BASE_URL}/pacientes/${id}`, // GET, PATCH, DELETE
    reactivate: (id: string) => `${API_BASE_URL}/pacientes/${id}/reactivate`,
  },

  //Podologos
  podologos: {
    //base: `${API_BASE_URL}/podologos`, // GET (todos), POST (crear)
    byId: (id: string) => `${API_BASE_URL}/podologos/${id}`, // GET, PATCH, DELETE
  },

  // Citas (El nuevo módulo)
  citas: {
    base: `${API_BASE_URL}/appointments`, // POST (reservar)
  },

  // Comunes (Catálogos)
  common: {
    paises: `${API_BASE_URL}/common/paises`,
    tiposSangre: `${API_BASE_URL}/common/tipos-sangre`,
  },
};