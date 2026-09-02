# Dental Agenda — Contexto del proyecto

Plataforma administrativa para consultorios odontológicos. Multi-tenant: cada consultorio tiene su `clinicId`, todos los datos cuelgan de ahí. Proyecto final de carrera (UAP, Ingeniería en Sistemas) con cliente real. Equipo de 3: Claude Code o GitHub Copilot (modo Agent en VSCode).

**Este archivo es la única fuente de contexto del proyecto y aplica a los tres agentes por igual:**
- **Claude Code** lo lee automáticamente a través de `CLAUDE.md` (que solo importa este archivo con `@AGENTS.md`).
- **Copilot** (modo Agent en VSCode o Copilot coding agent) lo lee de forma nativa si `AGENTS.md` está en la raíz del repo.
- **Claude web / Claude.ai**: NO lee el repo solo. Si se usa Claude web para planificar, hay que pegar el contenido de este archivo en las los archivos del Project o subirlo explicitamente como archivo en el chat (Recomendacion: subilo en el los archivos del proyecto directamente, y cuando arranques el chat indica al agente que lo lea) — si no, está trabajando con contexto viejo o inexistente.

Cualquiera de los tres agentes tiene que leer este archivo completo antes de planificar nada.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16, App Router, TypeScript 5 |
| Estilos | Tailwind CSS 3 + shadcn/ui + Radix primitives |
| UI compleja | MUI 5 (DatePicker), MUI X |
| Íconos | Lucide React + React Icons |
| Animaciones | GSAP + animaciones custom en Tailwind |
| Backend | Firebase 10 — Realtime Database, Auth, Storage (sin servidor propio) |
| Fechas | dayjs (locale español) |
| Toasts | react-hot-toast + componente propio `Toast.tsx` |
| PDF | pdfme |
| Tests | vitest + Testing Library |

**Pitfall de dependencias:** el proyecto corre Next 16 con React 18.2 (no 19). Hay mismatch de peer deps — por eso el CI y las instalaciones locales usan `npm ci --legacy-peer-deps` / `npm install --legacy-peer-deps`. No sacar ese flag sin resolver el mismatch primero.

---

## Estructura de carpetas

```
src/
├── app/
│   ├── page.tsx                 # redirect a /agenda
│   ├── agenda/page.tsx          # Agenda de turnos — referencia visual base del proyecto
│   ├── patients/
│   │   ├── page.tsx             # listado
│   │   └── [id]/page.tsx, clinicHistory/page.tsx, odontogram/page.tsx
│   ├── tariffs/page.tsx         # Aranceles
│   ├── config/page.tsx          # Clínica + profesionales + obras sociales + perfil admin
│   ├── estadisticas/page.tsx    # Dashboard — placeholder, sin implementar
│   ├── messenger/page.tsx       # Mensajería — WIP, casi vacío
│   ├── notSign/page.tsx         # Login
│   ├── dev/page.tsx             # Herramientas internas de seed/migración — NO user-facing
│   └── layout.tsx
├── components/
│   ├── appointments/ui/
│   ├── patients/ui/
│   ├── practices/ui/            # UI de Aranceles
│   ├── config/
│   ├── navigation/               # desktopVersion.tsx, mobileVersion.tsx
│   └── shared/                   # ver sección "Antes de crear UI nueva"
├── context/
│   └── AuthContext.tsx           # useAuth() → { user, loading, refreshUser }
├── hooks/                         # useMediaQuery, useOutsideClick, useCheckRoutine, useReloadPhotoURL
├── lib/
│   ├── firebase.ts                # init de Firebase desde variables de entorno
│   └── odontograma/               # dominio puro del odontograma — sin Firebase ni React
├── services/                      # TODAS las operaciones contra Firebase, por feature
│   ├── appointments/, patients/, practices/, config/, auth/, options/ (obras sociales)
│   └── odontograma/                # lectura/escritura del odontograma (B2-2, B2-3...)
├── dev/                            # scripts de seed/migración usados por app/dev/page.tsx
└── __tests__/                      # vitest — services, components, lib
```

Path alias `@/*` → `src/*`. `cn()` en `src/lib/utils.ts` para mergear clases Tailwind (clsx + tailwind-merge).

`src/lib/odontograma/` es la excepción a la regla de que la lógica vive en `services/`: es el dominio del odontograma en funciones y constantes puras, sin Firebase, sin React y testeable sin mocks. Los services de `odontograma/` lo consumen; nunca al revés. Plan de trabajo completo en `docs/odontograma-backend.md` (se documenta acá cuando el módulo esté cerrado). Lo detectado revisando el código ya mergeado y **no** arreglado en el momento, con el motivo de por qué no, está en `docs/odontograma-pendientes.md` — mirala antes de tocar el módulo, para no re-descubrir algo que ya está anotado ni "arreglar" algo que está así a propósito.

Las tres reglas de abajo no son solo convencion: dos estan verificadas por guards en
`src/__tests__/lib/odontograma/caras.test.ts`, que corren en el CI y rompen el PR.

- **Colores.** Ningun archivo del odontograma declara un color propio (ni una clase de
  Tailwind de una familia de color, ni un hex). El alcance es una lista explicita declarada
  arriba del `describe` —`src/lib/odontograma/`, `src/components/odontograma/` (todavia no
  existe, ya contemplado) y los archivos sueltos, hoy la pantalla del odontograma—. Si el
  componente va a vivir en otro lado, **agregar el lugar a esa lista es parte de la tarea**.
- **Caras.** Ningun archivo fuera de `src/lib/odontograma/` contiene `'MESIAL'`, `'DISTAL'`,
  `'VESTIBULAR'` ni `'LINGUAL_PALATINO'` — comentarios incluidos. Unica excepcion:
  `src/__tests__/lib/odontograma/`, que asevera sobre ellos. Escanea todo `src`.

Ninguno de los dos es hermetico y no pretenden serlo: cubren el caso realista, que es
portar el prototipo con su mapa de colores y su tabla de caras adentro del componente. Si
uno de los dos se pone en rojo, la salida es usar el dominio, no ampliar la excepcion.

Tres reglas de ese módulo que valen para cualquiera que lo toque, UI incluida.

**La traducción entre la posición que se clickea y la cara que se persiste la hace solo `caraSemantica()` en `caras.ts`.** De las cinco posiciones del cuadrado, cuatro dependen del cuadrante y por dos ejes independientes: `left`/`right` por hemiarcada del paciente —`left` es distal en la derecha (cuadrantes 1, 4, 5 y 8) y mesial en la izquierda— y `top`/`bottom` por arcada, porque el vestibular da hacia la cara externa del odontograma: arriba en la superior (1, 2, 5 y 6) y abajo en la inferior (3, 4, 7 y 8). Solo `center` es invariante. Los dos ejes salen de `arcadaDe()` y `hemiarcadaDe()` en `piezas.ts`, para que la tabla FDI y la geometría no puedan discrepar.

**El color de un hallazgo lo decide solo `colorDe(capa)`**, en el mismo archivo: existente rojo, requerida azul, devuelto como clases de Tailwind (`fill-*`, `text-*`, …) y nunca como hex. Ningún componente del odontograma escribe un color propio.

**El componente le pregunta al estado a través de `selectores.ts`, y nunca ve una `Cara`.** `hallazgoDeCara(estado, pieza, posicion, capa)` recibe la posición clickeada (`top`, `left`, …) y llama a `caraSemantica()` por dentro; `hallazgoDeDiente`, `tieneHallazgos` y `capasVisibles` completan el resto. Ninguna firma de ese archivo nombra una `Cara`: si el módulo devolviera una, el render volvería a tener con qué saltear la traducción. Consultar una pieza sin hallazgos es el camino normal —un odontograma vacío es `{}`, no 52 entradas—, así que los `hallazgoDe*` devuelven `undefined`, `tieneHallazgos` `false` y `capasVisibles` un array vacío congelado, sin ramas especiales en el JSX. Ojo con `filasDelArco(vista)`: la `fila` de `piezas.ts` es un identificador lógico y no el orden de render — en la ficha las temporarias van *entre* las permanentes, así que la vista mixta sale 1, 3, 4, 2.

**El service de lectura (`getOdontograma`, en `src/services/odontograma/`) es el único lugar que valida el dato crudo de Firebase.** Si aparece una clave de pieza o un código de hallazgo que no existe en el catálogo, se descarta solo esa pieza/hallazgo puntual y se loguea con `console.error` — nunca se rompe la lectura completa por un dato corrupto aislado. Mismo criterio que ya usan `getPatient`/`getPatients`. Un paciente sin odontograma cargado devuelve `{ dientes: {}, vinculos: {}, meta: null }`, nunca `null` — `null` es solo para cuando la lectura en sí falla (offline, error de Firebase).

---

## Modelo de datos — Firebase Realtime Database

**No hay esquema formal ni migraciones tipo SQL.** El árbol de abajo es una referencia útil pero puede haber quedado desactorizado — la fuente de verdad real son los archivos en `src/services/{feature}/` (definen la forma exacta de lectura/escritura de cada nodo) y, si hace falta confirmar datos ya cargados, la consola de Firebase.

```
/admins/{uid}
    userName, email, clinicId, isPhotoUpdate

/clinics/{clinicId}/
    appointments/{fecha}/{id}        # fecha = "09/05/2026"
        patientId, time, reason, observations, (time2..time6 para turnos multi-franja)

    patients/{id}
        name, dni, phone, email, insurance, timestamp (usado para paginación)
        clinicHistory/

    odontogramas/{pacienteId}/
        actual/
            dientes, vinculos, meta      # ver src/lib/odontograma/tipos.ts
        eventos/{evt}                    # log append-only, ver B2-1

    priceTariffs/{chapter}/{id}
        name, price, id

    professionals/{id}
        name, specialty, ...

    insurances/{id}
        name, plans/

    clinicInfo/
        clinicName, address, phone, ...
```

---

## Patrones de arquitectura

**Auth y multi-tenancy**
- Firebase Auth + React Context (`AuthContext.tsx`), centralizado — se llama una sola vez en `layout.tsx`, el resto consume el contexto (evita múltiples reads de Firebase por render).
- Todos los datos cuelgan de `/clinics/{clinicId}/`.
- Usuario no autenticado → redirect a `/notSign` vía `onAuthStateChanged`.
- `getUser()` depende de `onAuthStateChanged` — no funciona desde terminal sin sesión de browser activa.

**Datos**
- Capa de servicios: toda operación Firebase vive en `src/services/`. Sin API REST propia, todo es SDK directo (`get`, `set`, `update`, `remove`).
- Todo el fetching es client-side, no hay server components para datos.
- Migraciones de datos: patrón ya establecido es un botón temporal en `/dev` (ver `src/dev/migrateAddTimestamps.ts` como ejemplo), ejecutado con sesión de browser activa. Nunca un script externo.

**Componentes**
- Organización por feature, con subcarpeta `ui/` interna cuando la feature es compleja.
- Responsive: `useMediaQuery()` en 768px — desktop = Modal/Sidebar, mobile = Sheet/bottom-nav.
- Estado de formularios con `useState`, sin librerías de forms.
- Feedback con `Toast.tsx` + react-hot-toast, unificado en todo el proyecto.
- Confirmación obligatoria antes de acciones destructivas, vía `AlertDialog` (Radix).

---

## Antes de crear UI nueva — regla obligatoria

Antes de armar cualquier pantalla o componente nuevo, el agente tiene que darse una idea rápida de la estandarización visual del proyecto. No hace falta auditar el código entero ni gastar muchos tokens en esto — alcanza con mirar por arriba:

- **`/agenda, /patients, etc`** (`src/app/agenda/page.tsx`) — es la referencia visual base: márgenes, colores, patrones de layout.
- **Componentes base reutilizables** en `src/components/shared/` y `src/components/shared/ui/`: `Button`, `Card`, `AlertDialog`, `Sheet`, `Carousel`, `Toast`, `PageSlide`, `loading`, `confirmAlert`, `logOutAlert`.
- **Tokens de diseño** en `tailwind.config.ts`: color primario `teal-600`, y un set de animaciones custom ya definidas (`page-drop`, `move-from-right`, `move-from-left`, `slide-up`/`slide-down`, `forms-from-right`, `breathe`, `modal-appointment`, entre otras) — revisar si ya existe una animación que sirva antes de inventar una nueva.

Con esa idea general, **el agente tiene libertad total** para crear componentes nuevos o reusar los existentes. La única condición es que el resultado haga sinergia con lo que ya existe.

---

## Convenciones de nombres

- Archivos de componentes: PascalCase (`AddAppointmentForm.tsx`). Servicios/utils: camelCase.
- Componentes: PascalCase. Funciones/variables: camelCase. Interfaces/types: PascalCase.
- Rutas de Firebase: minúsculas con `/`.

---

## Git y control de versiones

- Ramas: `main` (producción) ← `dev` (integración) ← `feat/nombre-en-kebab-case` / `fix/nombre-en-kebab-case` / `refactor/nombre-en-kebab-case`.
- Todo PR entra a `dev`. `dev` → `main` por PR aparte.
- CI (`ci.yml`): en cada PR a `dev`/`main`/`odontograma-dev` corre `npm run build` y despues `npm run test:run`. Node 20, `actions/checkout@v4` y `actions/setup-node@v4`. **Los dos pasos son gate: un test rojo no entra.** Las credenciales de Firebase se inyectan como GitHub Secrets solo en el build — los tests no las necesitan porque los que tocan Firebase mockean `@/lib/firebase` con `vi.mock`, y esta verificado corriendo la suite sin `.env.local`.
- `.github/pull_request_template.md` es la checklist de PR: build y tests locales, no reimplementar el dominio del odontograma, `AGENTS.md` actualizado antes del commit, y lo detectado-y-no-arreglado en `docs/odontograma-pendientes.md`.
- Formato de commit — una sola línea de comando, sin backslash, sin `git add` previo:

```bash
git commit -m "tipo: título en español" -m "- cambio específico 1" -m "- cambio específico 2"
```

  Tipos: `feat:`, `fix:`, `refactor:`, `ci:`, `chore:`, `docs:`.

- **Pitfall Windows:** comillas simples en el mensaje de commit rompen si el texto tiene apóstrofes — usar comillas dobles.
- `git pull` solo trae la rama activa — si hace falta referenciar otra rama remota, `git fetch` antes.

---

## Metodología de trabajo (obligatoria para los tres agentes)

**0. Leer este archivo completo** antes de planificar cualquier cosa.

**1. Planificación bilateral.** Se discute la feature a puro feedback con agente + intengrantes del grupo si es necesario — qué hace, qué no hace, cómo se relaciona con lo que ya existe, flujo de pantallas. Sin código todavía. Se cierra cuando hay acuerdo en el alcance. Si hay ambigüedad de negocio o UX, el agente pregunta — no asume ni sigue de largo.

**2. Relevamiento de datos (si la feature toca Firebase).** No hay esquema SQL para consultar. Antes de asumir la forma de un nodo: revisar los servicios existentes en `src/services/{feature}/` que ya leen/escriben ese nodo, o el árbol real en la consola de Firebase. El árbol de este archivo es referencia, no ley.

**3. Migración de datos (si hace falta).** Seguir el patrón de `/dev`: botón temporal en la app, ejecutado con sesión de browser activa. Nunca un script externo standalone.

**4. Prompt de implementación.** Recién acá se define el prompt: contexto de negocio y UX, el qué y el por qué — no el cómo (sin nombres de función/archivo/variable salvo que sea estrictamente necesario). Si la DB ya está migrada para la feature, aclararlo en el prompt. El agente decide la implementación libremente, incluida la UI (ver regla de arriba).

**5. Testing.** Correr `npm run build` y los tests relevantes (`npm run test:run`) antes de dar por terminada la tarea.

**6. Actualizar este archivo.** Si la tarea agregó un patrón, una decisión de arquitectura, una carpeta o un nodo de Firebase nuevo que otro dev o agente necesitaría conocer, actualizar `AGENTS.md` con eso — **antes** del commit, no después.

**7. Commit y rama.** Nombre de rama primero, siempre antes que el commit. Formato de ambos en la sección de arriba.

---

## Estado de módulos y roadmap

Para el estado actual de issues, usar GitLab — no se duplica acá para no quedar desactualizado.

**Funcionales:** Agenda (`/agenda`), Pacientes (`/patients`), Aranceles (`/tariffs`), Config (`/config` — incluye gestión de profesionales y obras sociales).

**WIP / placeholder:** Mensajería (`/messenger`), Estadísticas (`/estadisticas`, sin implementar).

**Roadmap:** responsive completo, odontograma, historia clínica, dashboard de métricas, facturación, chatbot para pacientes, asistente IA para admin.