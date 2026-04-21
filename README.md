# 🦷 Dental Agenda

✦ · · · · · · · · · · · ✦ · · · · · · · · · · · ✦

Administrative platform for dental clinics. Centralizes appointment scheduling, patient management, clinical records, billing, and clinic configuration — all from a modern web interface optimized for both desktop and mobile.

> *"The system that works while you take care of patients."*

The platform currently covers four functional modules:

- 📅 **Appointments** — Daily agenda with a 8:00–18:00 time grid in 30-minute slots. Supports multi-slot appointments, patient search by name or DNI, reason linked to the clinic's billing, and actions on existing appointments (delete, share, send reminder)
- 👥 **Patients** — Full patient list with search, step-by-step registration form, inline field editing, clinical history, odontogram, and deletion with confirmation
- 💰 **Billing** — Practice management organized by dental chapters (Consultations, Operative Dentistry, Endodontics, Prosthetics, and more). Individual pricing per practice and bulk percentage updates per chapter
- ⚙️ **Config** — Profile photo, admin email, and clinic data settings

> 💬 **Messaging** module currently under development.

### Stack

- ⚡ **Next.js 14** — App Router & framework
- 🔷 **TypeScript** — Type safety
- 🔥 **Firebase** — Realtime Database, Authentication & Storage
- 🎨 **Tailwind CSS** — Styling
- 🧩 **MUI + Radix UI** — UI components & DatePicker
- 📄 **pdfme + jspdf** — PDF generation
- 🎬 **GSAP** — Animations
- 🪄 **Lucide React + React Icons** — Icon sets

### Roadmap

Modules planned for upcoming sprints:

- 📱 Responsive refactor
- 🦷 Odontogram
- 📋 Clinical history
- 📊 Metrics dashboard
- 💬 Messaging
- 🧾 Billing
- 🤖 Patient chatbot
- 🧠 AI assistant for administrators

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

✦ · · · · · · · · · · · ✦ · · · · · · · · · · · ✦
