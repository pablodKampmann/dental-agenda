# 🦷 Dental Agenda

Panel de administración para consultorios odontológicos. Permite gestionar turnos, pacientes, historias clínicas, aranceles y configuración del consultorio desde una interfaz web moderna, adaptada tanto para desktop como para móvil.

## Stack Tecnológico

- **Framework:** Next.js 13+ (App Router) con TypeScript
- **Base de datos:** Firebase Realtime Database
- **Autenticación:** Firebase Authentication (email/contraseña)
- **Storage:** Firebase Storage (imágenes de perfil)
- **UI:** Tailwind CSS + MUI (DatePicker, Calendar) + Radix UI
- **PDF:** `@pdfme/generator` + `jspdf-invoice-template`
- **Animaciones:** GSAP
- **Íconos:** Lucide React + React Icons

---

## Funcionalidades

### 📅 Agenda de Turnos
- Vista diaria con navegación por días y calendario
- Grilla horaria de 8:00 a 18:00 en franjas de 30 minutos
- Creación de turnos con duración configurable (30 min hasta 3 horas)
- Soporte de turnos multi-franja (rowspan visual automático)
- Búsqueda de paciente por nombre o DNI al crear un turno
- Motivo del turno vinculado al arancel del consultorio
- Acciones sobre turnos existentes: eliminar, compartir, enviar recordatorio

### 👥 Gestión de Pacientes
- Listado con búsqueda por nombre o DNI
- Alta de paciente con formulario en pasos (carousel)
- Ficha de paciente con edición inline de todos los campos
- Campos: nombre, apellido, género, fecha de nacimiento, DNI, teléfono, dirección, email, obra social, plan y número de afiliado
- Historia clínica por paciente
- Odontograma por paciente
- Eliminación con confirmación

### 💰 Aranceles (Billing)
- Organización por capítulos de prácticas odontológicas:
  - Consultas, Operatoria Dental, Endodoncia, Prótesis, Odontología Preventiva, Ortodoncia y Ortopedia Funcional, Odontopediatría, Periodoncia, Radiología, Cirugía
- CRUD de prácticas con precio individual
- Actualización masiva de precios por porcentaje (aumento o descuento) sobre un capítulo completo

### ⚙️ Configuración
- Cambio de foto de perfil
- Actualización de email del administrador
- Datos del consultorio

### 💬 Mensajería *(en desarrollo)*
- Módulo de mensajería a pacientes — actualmente en construcción

---

## Estructura del Proyecto

```
src/
├── app/
│   ├── page.tsx                        # Agenda principal
│   ├── billing/page.tsx                # Aranceles y prácticas
│   ├── patients/
│   │   ├── page.tsx                    # Listado de pacientes
│   │   └── [id]/
│   │       ├── page.tsx                # Ficha del paciente
│   │       ├── clinicHistory/page.tsx  # Historia clínica
│   │       └── odontogram/page.tsx     # Odontograma
│   ├── config/page.tsx                 # Configuración
│   ├── messenger/page.tsx              # Mensajería (WIP)
│   ├── notSign/page.tsx                # Pantalla de login
│   └── firebase.tsx                    # Inicialización de Firebase
├── components/
│   ├── appointments/                   # Lógica de turnos (CRUD)
│   ├── auth/                           # Autenticación y sesión
│   ├── config/                         # Configuración del consultorio
│   ├── general/                        # Alert, Loading, Navegación
│   ├── options/                        # Opciones de obras sociales
│   ├── patients/
│   │   ├── db/                         # CRUD de pacientes en Firebase
│   │   └── ui/                         # Componentes visuales de pacientes
│   ├── practices/                      # CRUD de prácticas/aranceles
│   └── ui/                             # Componentes base (Button, Card, etc.)
└── hooks/
    ├── useCheckRoutine.tsx             # Obtiene el usuario autenticado
    ├── useMediaQuery.tsx               # Hook responsive
    ├── useOutsideClick.tsx             # Detección de click externo
    └── useReloadPhotoURL.tsx           # Recarga de foto de perfil
```

---

## Modelo de Datos en Firebase

Los datos de cada consultorio están aislados por `clinicId`, lo que permite que múltiples consultorios operen de forma independiente sobre la misma instancia de Firebase.

```
/admins/{uid}
    ├── userName
    ├── email
    ├── clinicId          ← identifica al consultorio
    └── isPhotoUpdate

/clinics/{clinicId}/
    ├── appointments/
    │   └── {fecha}/
    │       └── {id}/     ← turno con patientId, time, time2..time6, observations
    ├── patients/
    │   └── {id}/         ← datos completos del paciente
    └── priceTariffs/
        └── {chapter}/
            └── {id}/     ← práctica con nombre y precio
```

---

## Instalación y Configuración

### Requisitos

- Node.js 18+
- Una cuenta y proyecto en [Firebase](https://firebase.google.com/)

### Pasos

1. Clonar el repositorio:

```bash
git clone https://github.com/tu-usuario/dental-agenda.git
cd dental-agenda
```

2. Instalar dependencias:

```bash
npm install
```

3. Configurar Firebase:

Creá el archivo `src/app/firebase.tsx` con las credenciales de tu proyecto Firebase:

```ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT.firebaseapp.com",
  databaseURL: "https://TU_PROJECT-default-rtdb.firebaseio.com",
  projectId: "TU_PROJECT",
  storageBucket: "TU_PROJECT.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
```

> ⚠️ **No comitas este archivo con credenciales reales.** Usá variables de entorno o agrega `firebase.tsx` al `.gitignore`.

4. Levantar el servidor de desarrollo:

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

### Scripts disponibles

| Comando | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Inicia el build de producción |
| `npm run lint` | Linting con ESLint |

---

## Alta de un Nuevo Consultorio

Para registrar un nuevo consultorio en el sistema:

1. Crear un usuario en Firebase Authentication con el email del administrador.
2. En Firebase Realtime Database, crear el nodo `/admins/{uid}` con los campos:
   - `userName`: nombre de usuario para el login
   - `email`: email del administrador
   - `clinicId`: identificador único para el consultorio (ej: `clinica-abc`)
3. Crear el nodo `/clinics/{clinicId}/` con la estructura de datos inicial.

---

## Licencia

MIT
