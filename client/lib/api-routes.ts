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
    base: `${API_BASE_URL}/podologos`, // GET (todos)
    byId: (id: string) => `${API_BASE_URL}/podologos/${id}`, // GET, PATCH, DELETE
  },

  // Citas (El nuevo módulo)
  citas: {
    base: `${API_BASE_URL}/appointments`, // POST (reservar)
    byPodologo: (podologoId: string, startDate?: string, endDate?: string) => {
      const params = new URLSearchParams({ podologoId });
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      return `${API_BASE_URL}/appointments?${params.toString()}`;
    },
    byDate: (podologoId: string, date: string) =>
      `${API_BASE_URL}/appointments/by-date?podologoId=${podologoId}&date=${date}`,
    getDetail: (citaId: string | number) =>
      `${API_BASE_URL}/appointments/${citaId}/detail`,
    updateDetail: (citaId: string | number) =>
      `${API_BASE_URL}/appointments/${citaId}/detail`,
    updateStatus: (citaId: string | number) =>
      `${API_BASE_URL}/appointments/${citaId}/status`,
    reschedule: (citaId: string | number) =>
      `${API_BASE_URL}/appointments/${citaId}/reschedule`,
    // Documentos
    getDocuments: (citaId: string | number) =>
      `${API_BASE_URL}/appointments/${citaId}/documents`,
    uploadDocument: (citaId: string | number) =>
      `${API_BASE_URL}/appointments/${citaId}/documents`,
    deleteDocument: (documentId: string | number) =>
      `${API_BASE_URL}/appointments/documents/${documentId}`,
  },

  // Comunes (Catálogos)
  common: {
    paises: `${API_BASE_URL}/common/paises`,
    tiposSangre: `${API_BASE_URL}/common/tipos-sangre`,
  },

  // Historial Médico
  historial: {
    searchPatients: (cedula: string, apellido: string) => {
      const params = new URLSearchParams();
      if (cedula) params.append('cedula', cedula);
      if (apellido) params.append('apellido', apellido);
      return `${API_BASE_URL}/historial/search?${params.toString()}`;
    },
    patientHistory: (pacienteId: string) =>
      `${API_BASE_URL}/historial/patient/${pacienteId}`,
    appointmentDetail: (citaId: string | number) =>
      `${API_BASE_URL}/historial/appointment/${citaId}`,
  },

  // Mis Citas (para el paciente logueado)
  misCitas: {
    myHistory: (userId: string, months?: string, estado?: string) => {
      const params = new URLSearchParams();
      if (months && months !== 'all') params.append('months', months);
      if (estado && estado !== 'all') params.append('estado', estado);
      const queryString = params.toString();
      return `${API_BASE_URL}/historial/patient/${userId}${queryString ? `?${queryString}` : ''}`;
    },
    detail: (citaId: string | number) =>
      `${API_BASE_URL}/historial/appointment/${citaId}`,
  },

  // Recetas
  recetas: {
    downloadPdf: (recetaId: string | number) =>
      `${API_BASE_URL}/recetas/${recetaId}/pdf`,
  },

  // Dashboard
  dashboard: {
    patient: (userId: string) => `${API_BASE_URL}/dashboard/patient/${userId}`,
    podologo: (userId: string, month?: number, year?: number) => {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      const queryString = params.toString();
      return `${API_BASE_URL}/dashboard/podologo/${userId}${queryString ? `?${queryString}` : ''}`;
    },
  },
};