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
    logout: `${API_BASE_URL}/auth/logout`,
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
    byDate: (podologoId: string | undefined, date: string) => {
      const url = `${API_BASE_URL}/appointments/by-date?date=${date}`;
      return podologoId && podologoId !== 'global'
        ? `${url}&podologoId=${podologoId}`
        : url;
    },
    getDetail: (citaId: string | number) =>
      `${API_BASE_URL}/appointments/${citaId}/detail`,
    updateDetail: (citaId: string | number) =>
      `${API_BASE_URL}/appointments/${citaId}/detail`,
    updateStatus: (citaId: string | number) =>
      `${API_BASE_URL}/appointments/${citaId}/status`,
    reschedule: (citaId: string | number) =>
      `${API_BASE_URL}/appointments/${citaId}/reschedule`,
    timeline: (citaId: string | number) =>
      `${API_BASE_URL}/appointments/${citaId}/timeline`,
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

  // Auditoría
  audit: {
    verifyPassword: () => `${API_BASE_URL}/audit/verify-password`,
    logs: (table?: string, limit?: number) => {
      const params = new URLSearchParams();
      if (table) params.append('table', table);
      if (limit) params.append('limit', limit.toString());
      const queryString = params.toString();
      return `${API_BASE_URL}/audit/logs${queryString ? `?${queryString}` : ''}`;
    },
    loginHistory: (limit?: number) =>
      `${API_BASE_URL}/audit/login-history${limit ? `?limit=${limit}` : ''}`,
    tables: () => `${API_BASE_URL}/audit/tables`,
  },

  // =====================================================
  // ADMINISTRADOR - Nuevas rutas
  // =====================================================
  admin: {
    // Gestión de Usuarios
    usuarios: {
      base: `${API_BASE_URL}/admin/usuarios`,
      byId: (id: string) => `${API_BASE_URL}/admin/usuarios/${id}`,
      deactivate: (id: string) => `${API_BASE_URL}/admin/usuarios/${id}/desactivar`,
      reactivate: (id: string) => `${API_BASE_URL}/admin/usuarios/${id}/reactivar`,
      list: (filters?: { tipo?: string; cedula?: string; apellido?: string; estado?: string }) => {
        const params = new URLSearchParams();
        if (filters?.tipo && filters.tipo !== 'todos') params.append('tipo', filters.tipo);
        if (filters?.cedula) params.append('cedula', filters.cedula);
        if (filters?.apellido) params.append('apellido', filters.apellido);
        if (filters?.estado && filters.estado !== 'todos') params.append('estado', filters.estado);
        const queryString = params.toString();
        return `${API_BASE_URL}/admin/usuarios${queryString ? `?${queryString}` : ''}`;
      },
    },
    // Citas Globales
    citas: {
      base: `${API_BASE_URL}/admin/citas`,
      list: (filters?: { estado?: string; fechaInicio?: string; fechaFin?: string; podologoId?: string }) => {
        const params = new URLSearchParams();
        if (filters?.estado && filters.estado !== 'todos') params.append('estado', filters.estado);
        if (filters?.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
        if (filters?.fechaFin) params.append('fechaFin', filters.fechaFin);
        if (filters?.podologoId) params.append('podologoId', filters.podologoId);
        const queryString = params.toString();
        return `${API_BASE_URL}/admin/citas${queryString ? `?${queryString}` : ''}`;
      },
    },
    // Estadísticas
    stats: `${API_BASE_URL}/admin/stats`,
    podologosList: `${API_BASE_URL}/admin/podologos-list`,
    // Crear Podólogo
    createPodologo: `${API_BASE_URL}/admin/podologos`,
    // Auditoría (sin verificación)
    auditoria: {
      logs: (table?: string, limit?: number) => {
        const params = new URLSearchParams();
        if (table) params.append('table', table);
        if (limit) params.append('limit', limit.toString());
        const queryString = params.toString();
        return `${API_BASE_URL}/admin/auditoria/logs${queryString ? `?${queryString}` : ''}`;
      },
      loginHistory: (limit?: number) =>
        `${API_BASE_URL}/admin/auditoria/login-history${limit ? `?limit=${limit}` : ''}`,
      tables: `${API_BASE_URL}/admin/auditoria/tables`,
    },
    // Documentos
    documentos: {
      base: `${API_BASE_URL}/admin/documentos`,
      stats: `${API_BASE_URL}/admin/documentos/stats`,
      list: (filters?: {
        pacienteId?: string;
        search?: string;
        startDate?: string;
        endDate?: string;
      }) => {
        const params = new URLSearchParams();
        if (filters?.pacienteId)
          params.append('pacienteId', filters.pacienteId);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        const queryString = params.toString();
        return `${API_BASE_URL}/admin/documentos${queryString ? `?${queryString}` : ''}`;
      },
    },
  },

  // Reportes PDF
  reports: {
    citasPdf: `${API_BASE_URL}/reports/citas-pdf`,
  },
};