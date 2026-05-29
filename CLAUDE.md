# Dental Agenda — Project Context

## What this app is

A dental clinic management SaaS. Multi-tenant: each clinic has its own `clinicId`. Core modules:
- **Agenda (/)** — daily appointment schedule with 30-min time slots (8:00–18:00)
- **Patients (/patients)** — patient list, profiles, clinical history, odontogram
- **Tariffs (/tariffs)** — dental practice pricing, organized by dental chapters
- **Config (/config)** — clinic info, professional/staff management, insurance plans, admin profile

## Tech stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14, App Router, TypeScript 5 |
| Styling | Tailwind CSS 3 + shadcn/ui + Radix UI primitives |
| Complex UI | MUI 5 (DatePicker), MUI X |
| Icons | Lucide React |
| Animations | GSAP, Tailwind Animate |
| Backend | Firebase 10: Realtime Database, Auth, Storage |
| Date utils | dayjs (with Spanish locale) |
| Toasts | react-hot-toast + custom `Toast.tsx` component |
| PDF | pdfme |

## Folder structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Appointments (main page)
│   ├── patients/           # Patient management
│   │   └── [id]/clinicHistory, odontogram
│   ├── tariffs/            # Pricing by dental chapter
│   ├── config/             # Clinic + admin settings
│   └── notSign/            # Login / unauthenticated
├── components/
│   ├── appointments/ui/    # Appointment-specific components
│   ├── patients/ui/        # Patient components
│   ├── practices/ui/       # Tariff components
│   ├── config/             # Config components
│   ├── navigation/         # Sidebar (desktop), bottom nav (mobile)
│   └── shared/             # Reusable: Toast, alert, loading, dialogs
├── context/
│   └── AuthContext.tsx     # Global auth state — useAuth() hook
├── hooks/                  # useMediaQuery, useOutsideClick, useCheckRoutine
├── lib/
│   └── firebase.ts         # Firebase init, exports db/auth/storage
└── services/               # All Firebase CRUD operations
    ├── appointments/
    ├── patients/
    ├── practices/
    ├── config/
    ├── auth/
    └── options/            # Insurances
```

## Architecture patterns

**Auth & multi-tenancy**
- Firebase Auth + React Context (`AuthContext.tsx`)
- `useAuth()` provides `{ user, loading, refreshUser }` — user includes `userUid`, `displayName`, `clinicId`
- All data in Realtime DB is scoped under `/clinics/{clinicId}/`
- Unauthenticated users redirected to `/notSign` via `onAuthStateChanged`

**Data fetching**
- Service layer pattern: all Firebase operations live in `src/services/`
- Direct Firebase SDK calls (`get`, `set`, `update`, `remove`) — no REST API
- No server components for data; all fetching is client-side

**Component patterns**
- Feature-based organization; complex features have an inner `ui/` subdirectory
- Responsive split: `useMediaQuery()` at 768px — desktop = Modal/Sidebar, mobile = Sheet/bottom-nav
- Controlled form state with `useState` — no form libraries
- Toast feedback via unified `Toast.tsx` + `react-hot-toast`
- Confirmation before destructive actions via Radix `AlertDialog`

**Imports**
- Path alias `@/*` maps to `src/*`
- `cn()` utility in `src/lib/utils.ts` for merging Tailwind classes (clsx + tailwind-merge)

## Firebase Realtime DB structure

```
/admins/{uid}
    userName, email, clinicId, isPhotoUpdate

/clinics/{clinicId}/
    appointments/{date}/{id}          # date = "09/05/2026"
        patientId, time, reason, observations, (time2..time6 for multi-slot)
    
    patients/{id}
        name, dni, phone, email, insurance, timestamp (for pagination)
        clinicHistory/, odontogramData/
    
    priceTariffs/{chapter}/{id}
        name, price, id
    
    professionals/{id}
        name, specialty, ...
    
    insurances/{id}
        name, plans/
    
    clinicInfo/
        clinicName, address, phone, ...
```

## Naming conventions

- **Files**: PascalCase for components (`AddAppointmentForm.tsx`), camelCase for services/utils
- **Components**: PascalCase
- **Functions/variables**: camelCase
- **Interfaces/types**: PascalCase
- **Firebase paths**: lowercase with slashes

## Key files to read when starting a task

| Task area | Read first |
|---|---|
| Auth/user | `src/context/AuthContext.tsx` |
| Appointments | `src/app/page.tsx`, `src/components/appointments/ui/` |
| Patients | `src/app/patients/page.tsx`, `src/components/patients/ui/` |
| Tariffs/billing | `src/app/tariffs/page.tsx`, `src/components/practices/ui/` |
| Config | `src/app/config/page.tsx`, `src/components/config/` |
| Toast/alerts | `src/components/shared/Toast.tsx`, `src/components/shared/alert.tsx` |
| Firebase ops | relevant `src/services/{feature}/` files |
| Styling tokens | `tailwind.config.ts` |

## Current branch & workflow

- Main branch: `main`; active dev on `dev`; feature branches like `feat/...`
- PRs are merged into `dev`, then `dev` → `main`
- Toast notification system was recently unified across all features (react-hot-toast + auto-hide)
