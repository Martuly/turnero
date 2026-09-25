# TuTurno

Sistema SaaS de gestión y reserva de turnos para profesionales, consultorios y pequeños negocios.

**TuTurno** permite administrar agendas, disponibilidad y reservas online desde una única plataforma, preparada para múltiples empresas (multiempresa).

Está desarrollado con:

- React + TypeScript + Vite
- Node.js + Express
- PostgreSQL
- n8n
- Google Calendar

---

# Características principales

- Arquitectura SaaS Multiempresa
- Reserva pública de turnos
- Gestión de profesionales
- Gestión de servicios
- Administración de disponibilidad
- Bloqueos de agenda
- Confirmación y cancelación por correo
- Integración con Google Calendar
- Dashboard administrativo
- Prevención de dobles reservas
- Diseño preparado para escalar a múltiples organizaciones

---

# Arquitectura

```
                    React + Vite
                          │
                          │ REST API
                          ▼
               Node.js + Express
                          │
         ┌────────────────┴────────────────┐
         │                                 │
 PostgreSQL (turno)                  n8n Workflows
         │                                 │
         │                                 │
         │                          Google Calendar
         │
  Información del negocio
```

---

# Modelo SaaS

TuTurno utiliza una arquitectura **multiempresa**.

Existe un único:

- Frontend
- Backend
- Base de datos PostgreSQL

Cada empresa se identifica mediante un **slug**.

Ejemplos:

```
/reservar/peluqueria
/reservar/drabrum
/reservar/clinica-central
```

Internamente todos los datos se separan mediante:

```
id_organizacion
```

Esto permite incorporar nuevos clientes sin desplegar nuevas aplicaciones.

---

# Estructura del proyecto

```
project/
│
├── src/
│   ├── api/
│   ├── components/
│   ├── config/
│   ├── context/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── types/
│   └── utils/
│
├── server/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── db/
│       ├── middleware/
│       ├── repository/
│       ├── routes/
│       ├── services/
│       ├── types/
│       └── utils/
│
└── README.md
```

---

# Tecnologías

## Frontend

- React
- TypeScript
- React Router
- Vite

## Backend

- Node.js
- Express
- PostgreSQL
- TypeScript

## Integraciones

- n8n
- Google Calendar
- Gmail

---

# Configuración

## Frontend

Archivo:

```
.env
```

Variables:

```env
VITE_API_MODE=real
VITE_API_URL=http://localhost:4000/api
```

### Modos disponibles

### mock

Utiliza datos simulados.

Ideal para desarrollo sin backend.

### real

Consume la API REST.

Requiere backend y PostgreSQL.

---

## Backend

Archivo:

```
server/.env
```

Variables:

```env
PORT=4000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=turno

DB_USER=postgres
DB_PASSWORD=*****

JWT_SECRET=********

CORS_ORIGIN=http://localhost:5173
```

---

# Instalación

## Frontend

```bash
npm install
npm run dev
```

---

## Backend

```bash
cd server

npm install

npm run dev
```

---

## Compilar

```bash
npm run build
```

---

## Producción

```bash
npm start
```

---

# Base de datos

Motor:

```
PostgreSQL
```

Crear la base:

```sql
CREATE DATABASE turno;
```

Luego ejecutar los scripts del proyecto.

---

# API REST

## Endpoints públicos

### Obtener organización

```
GET /api/public/organizaciones/:slug
```

Ejemplo:

```
GET /api/public/organizaciones/peluqueria
```

---

### Servicios públicos

```
GET /api/public/organizaciones/:slug/servicios
```

---

### Próximamente

```
GET /api/public/organizaciones/:slug/profesionales
```

---

# Servicios

```
GET    /api/servicios
GET    /api/servicios/activos
GET    /api/servicios/:id

POST   /api/servicios
PUT    /api/servicios/:id
DELETE /api/servicios/:id
```

---

# Profesionales

```
GET    /api/profesionales
GET    /api/profesionales/activos
GET    /api/profesionales/:id

POST   /api/profesionales
PUT    /api/profesionales/:id
DELETE /api/profesionales/:id
```

---

# Disponibilidad

```
GET /api/disponibilidad

PUT /api/disponibilidad

GET /api/disponibilidad/horarios
```

Parámetros:

```
idServicio

fecha

idProfesional (opcional)
```

---

# Turnos

```
GET /api/turnos

GET /api/turnos/:id

POST /api/turnos

PATCH /api/turnos/:id/estado
```

Filtros:

```
fechaDesde

fechaHasta

idProfesional

idServicio

estado
```

---

# Clientes

```
GET /api/clientes
```

---

# Dashboard

```
GET /api/dashboard/resumen
```

---

# Prevención de dobles reservas

La creación de un turno se realiza dentro de una transacción PostgreSQL.

Proceso:

1. Validación de disponibilidad.
2. Inicio de transacción.
3. Revalidación de conflictos.
4. Restricción de exclusión (`EXCLUDE USING GIST`).
5. Creación del cliente si no existe.
6. Registro del turno.

Si dos personas intentan reservar el mismo horario al mismo tiempo, PostgreSQL rechaza automáticamente la segunda operación.

---

# Integración con n8n

Actualmente se encuentran implementados los siguientes procesos:

- Nuevo turno
- Confirmación por correo
- Cancelación
- Reprogramación
- Integración con Google Calendar
- Persistencia del `calendar_event_id`
- Gestión mediante `token_gestion`

PostgreSQL continúa siendo la fuente principal de información.

Google Calendar funciona como integración complementaria.

---

# Seguridad

- Autenticación JWT
- Middleware de autorización
- Separación de datos por organización
- Validaciones de negocio
- Manejo centralizado de errores
- Protección contra dobles reservas

---

# Roadmap

- Portal público por organización

```
/reservar/:slug
```

- Multiempresa completo
- WhatsApp Business
- Recordatorios automáticos
- Pagos online
- Dashboard por organización
- Configuración personalizada
- Marca blanca (White Label)

---

# Estado del proyecto

Estado actual:

- Backend REST operativo
- Frontend administrativo operativo
- Reserva pública operativa
- PostgreSQL operativo
- Integración con n8n operativa
- Google Calendar operativo
- Confirmaciones por correo operativas
- Arquitectura Multiempresa en implementación

---

# Licencia

Proyecto desarrollado por **Martulym IT**.

Todos los derechos reservados.