# Arquitectura del Sistema — Prospera Digital

> **Tip:** Para pegar en [mermaid.live](https://mermaid.live), copia SOLO el contenido entre las líneas `---INICIO---` y `---FIN---`.

---INICIO---
```mermaid
flowchart LR
    %% Estilos Globales
    classDef actor fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef frontend fill:#000000,stroke:#fff,stroke-width:2px,color:#fff;
    classDef backend fill:#E0234E,stroke:#fff,stroke-width:2px,color:#fff;
    classDef database fill:#3ECF8E,stroke:#fff,stroke-width:2px,color:#fff;

    %% Actores
    Users(("👥 Usuarios\n(Paciente / Podólogo)")):::actor

    %% Capa 1: Presentación
    subgraph Vercel ["🌐 Capa de Presentación (Vercel)"]
        NextJS["🚀 Frontend Next.js\n(App Router)"]:::frontend
    end

    %% Capa 2: Negocio
    subgraph Render ["⚙️ Capa de Negocio (Render)"]
        Backend["🧠 Backend NestJS\n(Lógica de negocio, validaciones y notificaciones)"]:::backend
    end

    %% Capa 3: Datos y Servicios
    subgraph SupabaseContainer ["☁️ Capa de Datos y Servicios (Supabase)"]
        direction TB
        DB[("🐘 PostgreSQL DB")]:::database
        SupAuth["🔑 Auth Service"]:::database
        Buckets["📦 Storage Buckets"]:::database
    end

    %% Flujos
    Users -- HTTPS --> NextJS
    
    %% Comunicación Frontend -> Backend (Regla General)
    NextJS == Peticiones REST API / JSON ==> Backend
    
    %% Excepción: Comunicación directa SDK -> Auth (Recuperación/SESIÓN)
    NextJS -. SDK @supabase/ssr .-> SupAuth
    
    %% Comunicación Backend -> Supabase
    Backend ==> DB
    Backend -. Envío Enlaces Auth .-> SupAuth
    Backend -. Subida/Lectura .-> Buckets
```
---FIN---

## Leyenda

| Capa | Tecnología | Despliegue | Responsabilidad |
|------|-----------|------------|-----------------|
| **Presentación** | Next.js 14 | Vercel | Renderizado de UI e interacción del usuario. Gestiona la sesión segura en cliente/servidor (SSR). |
| **Negocio** | NestJS | Render | Recibe las peticiones, procesa las reglas del negocio (ej. agendas, correos) y centraliza la comunicación con la BD. |
| **Datos / BaaS** | Supabase | Supabase | Provee la persistencia de datos (PostgreSQL), el manejo de identidades (Auth) y el almacenamiento (Storage Buckets). |

## Flujos principales

1. **Interacción del Usuario:** El usuario interactúa únicamente con el **Frontend (Next.js)** a través de su navegador.
2. **Centralización Lógica:** La inmensa mayoría de acciones del Frontend (reservar citas, cancelar) se procesan mediante llamadas REST API al **Backend (NestJS)**.
3. **Optimización con BaaS (Backend as a Service):** Como excepción premeditada, operaciones como el *reseteo o actualización final de la contraseña*, son gestionadas íntegramente por el **Frontend** apuntando directo al **Auth Service de Supabase** (línea punteada). Esto descarga el tráfico de seguridad en el backend, aprovechando la infraestructura manejada por Supabase.
4. **Persistencia y Nube:** Es el **Backend en NestJS** quien interactúa directamente con la Base de datos relacional y los buckets de almacenamiento como fuente de verdad.
