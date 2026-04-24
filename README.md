<p align="center">
  <img src="./public/tooth_square_for_github.png" width="140" />
</p>

<h1 align="center">🦷 Dental Agenda</h1>

<p align="center">
  Administrative platform for dental clinics
</p>

---

> 🇦🇷 Versión en español

Plataforma administrativa para consultorios odontológicos. Centraliza la gestión de turnos, pacientes, historiales clínicos, aranceles y configuración del consultorio — todo desde una interfaz web moderna, adaptada tanto para desktop como para móvil.

> *"El sistema que trabaja mientras vos atendés."*

La plataforma cuenta actualmente con cuatro módulos funcionales:

* 📅 **Agenda de Turnos** — Vista diaria con grilla horaria de 8:00 a 18:00 en franjas de 30 minutos. Soporta turnos multi-franja, búsqueda de paciente por nombre o DNI, motivo vinculado al arancel del consultorio y acciones sobre turnos existentes (eliminar, compartir, enviar recordatorio)
* 👥 **Pacientes** — Listado con búsqueda, formulario de alta en pasos, edición inline de todos los campos, historia clínica, odontograma y eliminación con confirmación
* 💰 **Aranceles** — Gestión de prácticas organizada por capítulos odontológicos (Consultas, Operatoria Dental, Endodoncia, Prótesis y más). Precio individual por práctica y actualización masiva por porcentaje por capítulo
* ⚙️ **Configuración** — Foto de perfil, email del administrador y datos del consultorio

> 💬 El módulo de **Mensajería** está actualmente en desarrollo.

### Stack

* ⚡ **Next.js 14** — App Router y framework
* 🔷 **TypeScript** — Tipado estático
* 🔥 **Firebase** — Realtime Database, Authentication y Storage
* 🎨 **Tailwind CSS** — Estilos
* 🧩 **MUI + Radix UI** — Componentes UI y DatePicker
* 📄 **pdfme + jspdf** — Generación de PDFs
* 🎬 **GSAP** — Animaciones
* 🪄 **Lucide React + React Icons** — Set de íconos

### Roadmap

Módulos planificados para próximos sprints:

* 📱 Refactor responsive
* 🦷 Odontograma
* 📋 Historia clínica
* 📊 Dashboard de métricas
* 💬 Mensajería
* 🧾 Facturación
* 🤖 Chatbot para pacientes
* 🧠 Asistente IA para el administrador

> **Target MVP:** 2–3 meses — **Producto final:** 5–6 meses

### Modelo de Datos en Firebase

Los datos de cada consultorio están aislados por `clinicId`, lo que permite que múltiples consultorios operen de forma independiente sobre la misma instancia de Firebase.

```
/admins/{uid}
    ├── userName
    ├── email
    ├── clinicId
    └── isPhotoUpdate

/clinics/{clinicId}/
    ├── appointments/{fecha}/{id}
    ├── patients/{id}
    └── priceTariffs/{chapter}/{id}
```

### Cómo correr el proyecto

1. Cloná el repo e instalá las dependencias:

```bash
git clone https://github.com/pablodKampmann/dental-agenda.git
cd dental-agenda
npm install
```

2. Creá un archivo `.env.local` en la raíz con las credenciales de tu proyecto Firebase:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

3. Comandos disponibles:

```bash
npm run dev      # levanta el servidor de desarrollo en localhost:3000
npm run build    # build de producción — corre el chequeo de tipos y compila
```

> ⚠️ No comitas credenciales reales. `.env.local` ya está ignorado por `.gitignore`.

<br/>

```
 ✦ · · · · · · · · · · · ✦ · · · · · · · · · · · ✦
              🇺🇸  English version
 ✦ · · · · · · · · · · · ✦ · · · · · · · · · · · ✦
```

<br/>

> 🇺🇸 English version

Administrative platform for dental clinics. Centralizes appointment scheduling, patient management, clinical records, billing, and clinic configuration — all from a modern web interface optimized for both desktop and mobile.

> *"The system that works while you take care of patients."*

The platform currently covers four functional modules:

* 📅 **Appointments** — Daily agenda with a 8:00–18:00 time grid in 30-minute slots. Supports multi-slot appointments, patient search by name or DNI, reason linked to the clinic's billing, and actions on existing appointments (delete, share, send reminder)
* 👥 **Patients** — Full patient list with search, step-by-step registration form, inline field editing, clinical history, odontogram, and deletion with confirmation
* 💰 **Billing** — Practice management organized by dental chapters (Consultations, Operative Dentistry, Endodontics, Prosthetics, and more). Individual pricing per practice and bulk percentage updates per chapter
* ⚙️ **Config** — Profile photo, admin email, and clinic data settings

> 💬 **Messaging** module currently under development.

### Stack

* ⚡ **Next.js 14** — App Router & framework
* 🔷 **TypeScript** — Type safety
* 🔥 **Firebase** — Realtime Database, Authentication & Storage
* 🎨 **Tailwind CSS** — Styling
* 🧩 **MUI + Radix UI** — UI components & DatePicker
* 📄 **pdfme + jspdf** — PDF generation
* 🎬 **GSAP** — Animations
* 🪄 **Lucide React + React Icons** — Icon sets

### Roadmap

Modules planned for upcoming sprints:

* 📱 Responsive refactor
* 🦷 Odontogram
* 📋 Clinical history
* 📊 Metrics dashboard
* 💬 Messaging
* 🧾 Billing
* 🤖 Patient chatbot
* 🧠 AI assistant for administrators

> **MVP target:** 2–3 months — **Full product:** 5–6 months

### Firebase Data Model

All clinic data is isolated by `clinicId`, allowing multiple clinics to operate independently on the same Firebase instance.

```
/admins/{uid}
    ├── userName
    ├── email
    ├── clinicId
    └── isPhotoUpdate

/clinics/{clinicId}/
    ├── appointments/{date}/{id}
    ├── patients/{id}
    └── priceTariffs/{chapter}/{id}
```

### Getting Started

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/pablodKampmann/dental-agenda.git
cd dental-agenda
npm install
```

2. Create a `.env.local` file in the root with your Firebase credentials:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

3. Available commands:

```bash
npm run dev      # start the development server at localhost:3000
npm run build    # production build — runs type checking and compilation
```

> ⚠️ Never commit real credentials. `.env.local` is already ignored by `.gitignore`.