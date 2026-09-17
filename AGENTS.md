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
│   ├── agenda/page.tsx          # Agenda de turnos
│   ├── patients/
│   │   ├── page.tsx             # listado (buscador en patientsToolbar.tsx, tabla en table.tsx)
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
│   │   └── odontogram/           # Tooth, OdontogramaGrid, Legend, HallazgoPicker, FloatingAnchor...
│   ├── practices/ui/            # UI de Aranceles
│   ├── config/
│   ├── navigation/               # desktopVersion.tsx, mobileVersion.tsx, UserMenu.tsx, SidebarCarousel.tsx
│   └── shared/                   # ver sección "Antes de crear UI nueva"
├── context/
│   └── AuthContext.tsx           # useAuth() → { user, loading, refreshUser }
├── hooks/                         # useMediaQuery, useOutsideClick, useCheckRoutine, useReloadPhotoURL
│                                  # usePopoverAnchor + usePopoverReveal (ver "Componentes" — CustomSelect)
├── lib/
│   ├── firebase.ts                # init de Firebase desde variables de entorno
│   └── odontograma/               # dominio puro del odontograma — sin Firebase ni React
├── services/                      # TODAS las operaciones contra Firebase, por feature
│   ├── appointments/, patients/, practices/, config/, auth/, options/ (obras sociales)
│   ├── navigation/                 # getSidebarCarouselData, sidebarCarouselEvents (ver "Sidebar y topbar")
│   └── odontograma/                # lectura/escritura del odontograma (B2-2, B2-3...)
├── dev/                            # scripts de seed/migración usados por app/dev/page.tsx
└── __tests__/                      # vitest — services, components, lib
```

Path alias `@/*` → `src/*`. `cn()` en `src/lib/utils.ts` para mergear clases Tailwind (clsx + tailwind-merge).

`src/lib/odontograma/` es la excepción a la regla de que la lógica vive en `services/`: es el dominio del odontograma en funciones y constantes puras, sin Firebase, sin React y testeable sin mocks. Los services de `odontograma/` lo consumen; nunca al revés. Plan de trabajo completo en `docs/odontograma-backend.md` (back) y `docs/odontograma-frontend.md` (front, complemento del anterior — no arranca hasta que el backend esté cerrado) — se documenta acá cuando el módulo esté cerrado. Lo detectado revisando el código ya mergeado y **no** arreglado en el momento, con el motivo de por qué no, está en `docs/odontograma-pendientes.md` — mirala antes de tocar el módulo, para no re-descubrir algo que ya está anotado ni "arreglar" algo que está así a propósito.

Las tres reglas de abajo no son solo convencion: dos estan verificadas por guards en
`src/__tests__/lib/odontograma/caras.test.ts`, que corren en el CI y rompen el PR.

- **Colores.** Ningun archivo del odontograma declara un color propio (ni una clase de
  Tailwind de una familia de color, ni un hex). El alcance ya no es una lista de carpetas:
  es todo archivo de `src` que importe de `@/lib/odontograma/`, mas sus hermanos de
  carpeta — asi un componente nuevo cae adentro del escaneo solo, este donde este, sin que
  nadie tenga que declarar el lugar a mano. El shade de las clases se restringe a `600`
  sin variante de interaccion delante (lo unico que `colorDe()` puede devolver), y el hex
  se juzga por dominancia de canal rojo/azul — así el rojo de un boton "eliminar" o el
  slate/teal de un contorno no rompen el guard por casualidad.
- **Caras.** Ningun archivo fuera de `src/lib/odontograma/` contiene `'MESIAL'`, `'DISTAL'`,
  `'VESTIBULAR'` ni `'LINGUAL_PALATINO'` — comentarios incluidos. Unica excepcion:
  `src/__tests__/lib/odontograma/`, que asevera sobre ellos. Escanea todo `src`.

Ninguno de los dos es hermetico y no pretenden serlo: cubren el caso realista, que es
portar el prototipo con su mapa de colores y su tabla de caras adentro del componente. Si
uno de los dos se pone en rojo, la salida es usar el dominio, no ampliar la excepcion.

Tres reglas de ese módulo que valen para cualquiera que lo toque, UI incluida.

**La traducción entre la posición que se clickea y la cara que se persiste la hace solo `caraSemantica()` en `caras.ts`.** De las cinco posiciones del cuadrado, cuatro dependen del cuadrante y por dos ejes independientes: `left`/`right` por hemiarcada del paciente —`left` es distal en la derecha (cuadrantes 1, 4, 5 y 8) y mesial en la izquierda— y `top`/`bottom` por arcada, porque el vestibular da hacia la cara externa del odontograma: arriba en la superior (1, 2, 5 y 6) y abajo en la inferior (3, 4, 7 y 8). Solo `center` es invariante. Los dos ejes salen de `arcadaDe()` y `hemiarcadaDe()` en `piezas.ts`, para que la tabla FDI y la geometría no puedan discrepar.

**El color de un hallazgo lo decide solo `colorDe(capa)`**, en el mismo archivo: existente rojo, requerida azul, devuelto como clases de Tailwind (`fill-*`, `text-*`, …) y nunca como hex. Ningún componente del odontograma escribe un color propio. Es la convención de la ficha en papel de la clínica — está **invertida** respecto de la norma MINSA y del prototipo de referencia (`dental-agenda-main/project`), que usan existente azul / planificado rojo. Portar un componente del prototipo sin ajustar el color muestra en pantalla exactamente lo contrario de lo que la odontóloga anotó en el papel.

**El componente le pregunta al estado a través de `selectores.ts`, y nunca ve una `Cara`.** `hallazgoDeCara(estado, pieza, posicion, capa)` recibe la posición clickeada (`top`, `left`, …) y llama a `caraSemantica()` por dentro; `hallazgoDeDiente`, `tieneHallazgos` y `capasVisibles` completan el resto. Ninguna firma de ese archivo nombra una `Cara`: si el módulo devolviera una, el render volvería a tener con qué saltear la traducción. Consultar una pieza sin hallazgos es el camino normal —un odontograma vacío es `{}`, no 52 entradas—, así que los `hallazgoDe*` devuelven `undefined`, `tieneHallazgos` `false` y `capasVisibles` un array vacío congelado, sin ramas especiales en el JSX. Ojo con `filasDelArco(vista)`: la `fila` de `piezas.ts` es un identificador lógico y no el orden de render — en la ficha las temporarias van *entre* las permanentes, así que la vista mixta sale 1, 3, 4, 2.

**El service de lectura (`getOdontograma`, en `src/services/odontograma/`) es el único lugar que valida el dato crudo de Firebase.** Si aparece una clave de pieza o un código de hallazgo que no existe en el catálogo, se descarta solo esa pieza/hallazgo puntual y se loguea con `console.error` — nunca se rompe la lectura completa por un dato corrupto aislado. Mismo criterio que ya usan `getPatient`/`getPatients`. Un paciente sin odontograma cargado devuelve `{ dientes: {}, vinculos: {}, meta: null }`, nunca `null` — `null` es solo para cuando la lectura en sí falla (offline, error de Firebase).

### UI del odontograma y la Historia Clínica

**Historia Clínica es un tab único, no dos.** El tab "Odontograma" que existía en `patientRecord.tsx` se eliminó — el odontograma vive fusionado dentro de `/patients/[id]/clinicHistory/page.tsx`, arriba de la Historia Clínica. La ruta vieja `/patients/[id]/odontogram/page.tsx` sigue en el repo (huérfana, sin link desde ningún lado) por si hace falta rescatar algo, pero no es user-facing. Todo lo del odontograma vive en `src/components/patients/ui/odontogram/`:

| Componente | Responsabilidad |
|---|---|
| `Tooth.tsx` | Un diente: SVG con geometría de cuadrado interior + 4 trapecios (caras) a viewBox fijo (`VB=40`), escala 100% por CSS. Hallazgos de pieza completa se dibujan a tamaño real sobre todo el diente (grafismo del catálogo), no como badge chico. |
| `OdontogramaGrid.tsx` | Grilla fluida de 16 columnas `fr` — cada pieza usa su `pieza.columna` real (ver `piezas.ts`), así las temporarias quedan alineadas debajo de su sucesora permanente sin cálculo propio y sin scroll horizontal. |
| `Legend.tsx` | Toggle de capas visibles + lista del catálogo. Layout del header es determinístico (`grid grid-cols-2`, nunca flexbox libre) para que no se rompa en contenedores angostos — ver nota de responsive abajo. |
| `FindingGlyph.tsx` | Ícono chico de un hallazgo según su `grafismo` del catálogo (`fill`, `cross`, `box`, `letter`, `screw`, `stump`, `equals`, `span`). Único lugar que dibuja esas formas. |
| `FloatingAnchor.tsx` | Primitivo genérico de popover anclado — ver regla abajo, cualquier popover nuevo del odontograma se apoya acá. |
| `HallazgoPicker.tsx` | El picker que abre al clickear un diente/cara. Flujo en 3 pasos, ver regla abajo. |
| `HistorialTimeline.tsx` | El timeline de la Historia Clínica: notas libres + entradas generadas por hallazgos, con editar/eliminar. |

**`FloatingAnchor` necesita el alto exacto por adelantado, nunca lo mide después de pintar.** Pasarle `height` (número fijo, en px) es obligatorio. La tentación de usar `useLayoutEffect` + `offsetHeight` para decidir arriba/abajo del anchor causa un "teletransporte" visible (una pintada en un lugar, reflow al lugar correcto un frame después) — ya pasó una vez en este módulo. Si un contenido nuevo necesita alto variable, hay que definirle un alto fijo por diseño (como hace `HallazgoPicker`) en vez de medirlo.

**El picker de hallazgos es un flujo de 3 pasos con alto fijo: elegir → confirmar → nota.** Click en un hallazgo de la lista no aplica nada todavía, solo selecciona. "Confirmar" es un paso propio, explícito. La nota es siempre posterior a confirmar, nunca simultánea. El cuerpo (`ALTO_CUERPO` en `HallazgoPicker.tsx`) tiene altura fija — ningún paso cambia el tamaño del panel, solo el contenido de adentro, con scroll interno si hace falta. El header (capa + título) también es la misma estructura en los tres pasos por el mismo motivo.

**Los hallazgos de pieza completa que dejan sin sentido a las caras las ocultan de la vista, nunca las borran.** El set `OCULTA_CARAS` en `Tooth.tsx` (`ausente`, `extraccion`, `retenida`, `remanente`) hace que el render de caras se salte por completo mientras ese hallazgo esté activo — el dato de `caras/` en el estado sigue intacto, y si se quita el hallazgo reaparece solo. Corona, implante y endodoncia no entran en ese set: conviven con hallazgos de cara sin ninguna regla especial.

**El catálogo declara a qué dentición aplica cada hallazgo, y los services lo hacen cumplir (B4-1).** `EntradaHallazgo.denticiones` (`catalogo.ts`) es `['PERMANENTE']`, `['TEMPORARIA']` o ambas; `aplicaADenticion(codigo, denticion)` es la única función que lo consulta, y la consultan los siete services de escritura por igual —`setHallazgoCara` y `ejecutarHallazgoCaraRequerida` incluidos, aunque hoy los cuatro hallazgos de cara acepten las dos denticiones y esa rama nunca se dispare: la pregunta tiene que salir siempre del catálogo, no de una asunción implícita en la función que escribe. Solo `implante` y `protesis_fija` están restringidos a `PERMANENTE` — el resto del catálogo acepta las dos. La decisión de modelo que hizo falta tomar antes de esta issue: `no_erupcionada` se renombró a **`retenida`** («Pieza retenida o impactada») y dejó de ser el hallazgo que se cargaba a mano en cada permanente sin erupcionar de un chico — eso es lo normal para la edad y no se marca. Ahora es un hallazgo real, para cuando una pieza (de cualquier dentición) no erupcionó o no exfolió cuando le tocaba. Sigue compartiendo el grafismo `cross` con `ausente`, distinguidos por la capa. `codigo` es un valor persistido (se escribe en `actual/` y en `eventos/`); renombrar uno es una migración, no un refactor — ver `docs/odontograma-pendientes.md` §4.4 y §5 para lo que quedó pendiente de este rename puntual. El picker todavía no filtra por este campo — es criterio de aceptación de F4-1 (`docs/odontograma-pendientes.md` §3.7), no de B4-1 — la autoridad es siempre el backend, el filtro del picker es solo UX.

**Una pieza temporaria y su sucesora permanente son entidades separadas — nunca una "se convierte" en la otra (B4-2).** Cuando se cae la 55 y erupciona la 15, son dos hallazgos sobre dos piezas distintas: la 55 pasa a `ausente` (un `setHallazgoDiente` sobre `t55`) y, si la 15 estaba marcada `retenida`, se le borra ese hallazgo (`removeHallazgo` sobre `t15`) — nunca una operación que "mueva" el estado de una clave a la otra. El modelo ya lo soportaba sin cambios (son posiciones independientes en `dientes/`), lo que faltaba era el test que lo fijara: `recambioDentario.test.ts` simula el recambio y verifica dos eventos separados, uno por pieza, ninguno mencionando a la otra. Si la 15 no tenía ningún hallazgo cargado, erupcionar no requiere ningún cambio — no tenerlos es su estado normal hasta que le toca salir.

**Los services de escritura del odontograma comparten un único contrato de retorno: `ResultadoEscritura` (`setHallazgo.ts`).** `null` es fallo técnico (offline, error de Firebase); `{ ok: false, error }` es un rechazo por regla de negocio con un mensaje mostrable tal cual; `{ ok: true, ...}` es éxito. Los siete services de escritura (`setHallazgoCara`, `setHallazgoDiente`, `ejecutarHallazgoCaraRequerida`, `ejecutarHallazgoDienteRequerido`, `removeHallazgo`, `setVinculo`, `removeVinculo`) devuelven esta misma forma, aunque cuatro de ellos nunca usen la rama `ok: false` hoy. La razón de ser tan estrictos con esto: `{ ok: false }` es **truthy**, así que un caller escrito con `if (resultado)` tomaría un rechazo por un éxito y dejaría dibujado un hallazgo que nunca se guardó — `seedOdontograma.ts` es el ejemplo del patrón correcto (`resultado === null || !resultado.ok`). Ningún componente llama a estos services todavía (F4-1 es la que los conecta); cuando lo haga, tiene que escribir contra este contrato desde el día uno.

**El diente con el picker abierto escapa del backdrop oscuro por z-index, no por opacidad propia.** Cuando hay un picker abierto, `Tooth.tsx` recibe `activo` y se levanta con `relative z-[45]` — por encima del overlay del backdrop (`z-40` en `FloatingAnchor`) — así ese diente puntual queda sin atenuar mientras el resto del odontograma sí se oscurece. El anchor del picker es siempre el rect del **wrapper completo del diente** (cuadrado + número), nunca el del elemento puntual clickeado (una cara chica) — si no, el panel puede tapar el número o abrirse a mitad de camino.

**Responsive de este módulo: nunca resolver con un mínimo en píxeles peleando contra un ancho en `%`.** Si un contenedor necesita ser fluido (ej. la leyenda al lado de la grilla), el layout interno de ese contenedor tiene que poder angostarse sin romperse — `min-w-0` + `truncate` en el texto que puede desbordar, `shrink-0` en lo que no debe achicarse nunca, y layouts determinísticos (`grid` con columnas fijas) en vez de `flex` libre con `ml-auto` cuando hay poco margen de error. Un `min-w-[Npx]` puesto para "que no se vea feo angosto" termina anulando el `%` apenas el contenedor es más chico que ese mínimo — el fix real está adentro del componente, no en el wrapper.

**Vista mixta vs. permanente se decide por edad, con override manual.** `vistaSugeridaPorEdad()` en `clinicHistory/page.tsx`: 6 a 12 años inclusive → `'MIXTA'`, si no `'PERMANENTE'`. El profesional puede forzar la vista contraria con un botón en el header del odontograma; ese override gana siempre sobre la sugerencia. El orden de filas real (`FILAS_POR_VISTA` en `selectores.ts`, temporarias intercaladas entre las permanentes) es una decisión de dominio ya tomada y testeada — no tocarla desde la UI.

**La Historia Clínica hoy es solo front — nada de esto pega contra Firebase todavía.** `entradas` (tipo `EntradaHistorial`) vive en `useState` dentro de `clinicHistory/page.tsx`, se pierde al refrescar. Guardar un hallazgo desde el picker actualiza el mismo estado local (`dientes`), no `actual/` en Firebase. Cuando se conecte el backend real (B2-3 escribir hallazgos, y el log de eventos de B2-5), hay que reemplazar esos `setState` por las llamadas a los services correspondientes — la forma de los datos (`EntradaHistorial`, `PickerContexto`) ya está pensada para eso, no debería hacer falta rehacer la UI.

**Pitfall transversal: `layout.tsx` tiene `text-white` en el body.** Cualquier `<textarea>`/`<input>` nuevo que no fije su propio color de texto hereda blanco sobre fondo blanco — invisible hasta que se selecciona el texto. Poner siempre un `text-gray-*` explícito en inputs nuevos.

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

**Claves de `dientes/` con prefijo `t` (`t16`, `t46`...).** No es cosmético: si la clave fuera el código FDI puro (`"16"`, `"46"`), el SDK de Realtime Database convierte ese nodo en un array de JavaScript al leerlo — y la forma exacta del array (longitud, huecos) depende de cuántos dientes haya cargados en ese momento, no es estable. Con el prefijo, la clave nunca es un entero puro y el nodo siempre llega como objeto. Es la regresión que cubre el test de 32 dientes cargados en `getOdontograma.test.ts`; ver `ClavePieza` en `src/lib/odontograma/piezas.ts`.

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
- **Herramientas destructivas en `/dev`** (ej. "Borrar todos los pacientes", `src/dev/clearPatients.ts`) van con doble confirmación: `window.confirm()` con el detalle de qué se borra, más un input que exige tipear una palabra exacta ("BORRAR") para habilitar el botón — un solo `confirm()` es insuficiente para algo irreversible sin papelera. Los 6 botones de `/dev` (seeds, migración, borrado) llevan como mínimo el `window.confirm()`.
  - **`database.rules.json` define `odontogramas/{id}/eventos/{evt}` como append-only** (`.write` exige `!data.exists()`: solo permite *crear*, nunca sobreescribir ni borrar un evento ya existente — es el historial inmutable del módulo, a propósito). Un `update()` multi-path que intente poner `null` en el nodo `odontogramas/{id}` completo toca también esos eventos y Firebase devuelve `PERMISSION_DENIED` para **todo el batch**, no solo esa rama — un `update()` multi-path es atómico, así que una sola ruta rechazada tira abajo también el borrado de pacientes/turnos que sí tenían permiso. Por eso `clearPatients.ts` solo pone en `null` `odontogramas/{id}/actual` (el estado editable, con `.write` propio) y nunca toca `eventos/`.
  - **`appointment.patientId` se guarda como `number`** (ver `setAppointment(patientId: number, ...)`), mientras que las claves de `patients/` que devuelve `Object.keys()` son siempre `string` — comparar con un `Set` sin normalizar tipos (`set.has(appointment.patientId)`) da `false` siempre aunque el id "matchee" a simple vista. `clearPatients.ts` compara con `String(appointment.patientId)`. Mismo cuidado si se escribe otro cruce por `patientId` fuera de un service ya probado.
- **Listados con búsqueda: un solo fetch, filtrado y paginado en memoria — no re-consultar Firebase por cada tecla ni por cada "Cargar más".** Patrón usado en `/patients` (`getAllPatientsFull.ts`) y en el picker de paciente del alta de turno en `/agenda` (mismo service): se trae **todo** el nodo `patients/` de la clínica una sola vez al montar, y tanto la búsqueda (nombre/apellido/DNI) como la paginación visual (`visibleCount`, de a 100) son cálculos client-side (`.filter()`/`.slice()`) sobre ese array, sin filtro `orderByChild`/`startAt`/`endAt` contra Firebase y sin `limitToLast`. Es intencional dado el volumen real (decenas/cientos de pacientes por clínica, no miles): reemplazó un patrón viejo (`searchPatient.ts` + `getPatients.ts`, borrados) que hacía hasta 4 queries en paralelo por letra tipeada, sin debounce, tanto en `/patients` como en el picker de agenda. "Cargar más" no dispara ningún request nuevo, solo sube el `visibleCount` local. Si se necesita un service que traiga *todos* los pacientes en un futuro, evaluar primero si no alcanza con `getAllPatientsFull` antes de sumar una query más — ya hay tres versiones del mismo fetch completo (`getAllPatients.ts` para el sidebar carousel, con forma liviana; `getAllPatientsFull.ts` para listados con objeto completo) y no debería sumarse una cuarta sin motivo.

**Componentes**
- Organización por feature, con subcarpeta `ui/` interna cuando la feature es compleja.
- Responsive: `useMediaQuery()` en 768px decide sidebar (desktop) vs. bottom-nav (mobile) en `navigation.tsx`. **Los formularios no se bifurcan por dispositivo:** el `Sheet` de shadcn ya no se usa, un mismo modal responsive sirve para desktop y mobile (ver "Sistema visual").
- Estado de formularios con `useState`, sin librerías de forms.
- Feedback con `Toast.tsx` + react-hot-toast, unificado en todo el proyecto. `useToast().showToast(type, message, id?)` — el tercer argumento `id` es opcional: si se repite el mismo `id` en llamadas sucesivas (ej. reintentos de una misma validación fallida, como el submit de `ModalCreatePatient`), react-hot-toast **actualiza** ese toast en vez de apilar uno nuevo arriba del anterior. Sin `id`, cada llamada crea un toast independiente como siempre.
- Confirmación obligatoria antes de acciones destructivas, vía `AlertDialog` (Radix).
- **Lo que va en todos los tabs de una sección va en el componente compartido, no en cada `page.tsx`.** `PatientRecord` (`src/components/patients/ui/patientRecord.tsx`) es el ejemplo: el link "← Pacientes" y el resumen de Última visita/Próximo turno (`appointmentsSummary.tsx`) viven adentro de `PatientRecord`, no en `[id]/page.tsx`. Como cada tab de paciente monta `PatientRecord`, ambos aparecen en cualquier tab sin duplicar código ni arriesgarse a que un tab nuevo se olvide de agregarlos. Antes de copiar un bloque de UI de un `page.tsx` a otro, primero preguntarse si no debería subir al componente compartido que ya montan los dos.
- **Loading state por pantalla, no un spinner que tapa todo.** `Loading` (`src/components/shared/loading.tsx`, el diente girando a pantalla completa) se usa en 7+ pantallas del proyecto — no tocarlo para un caso puntual. Para una pantalla con estructura ya conocida (como la ficha de paciente), un skeleton dedicado que respeta el layout real (`patientRecordSkeleton.tsx`, con `animate-pulse`) da una transición mucho menos brusca al cambiar de tab que un overlay que oculta todo.
- **`EditableRow` (`src/components/patients/ui/editableRow.tsx`) es el componente estándar único para "campo con lápiz que se convierte en input al editar"** — lo usan tanto `/patients/[id]` como `/config`, con el mismo criterio: no reinventar este patrón a mano en una pantalla nueva.
  - Flujo: label + valor + lápiz → click abre input (o `renderInput` custom) + X (cancela) + check (confirma) → `submitChanges(changes, rowKey, category)` en el padre pega a Firebase y cierra. `renderInput` es la vía para reemplazar el input default por algo custom (select, fecha, textarea de otro tamaño, wizard multi-paso) sin bifurcar el componente.
  - **Extraídos para no repetir lógica de teclado/estado a mano en cada `page.tsx`:** `SelectField` y `DateField` (`src/components/patients/ui/fields/`). `DateField` usa el hook `useOutsideClick` ya existente — no reinventar el listener de click-afuera. `SelectField` hoy es un wrapper delgado de `CustomSelect` (ver más abajo) — mantiene su firma vieja (`onSubmit`/`onCancel`) solo por compatibilidad con los callers existentes, pero no los usa.
  - **Altura animada, no un salto.** Mide con `useLayoutEffect` (nunca `useEffect`, que llega tarde y causa un frame de flash) y anima con un patrón FLIP: congela el alto viejo, un frame después anima al alto nuevo. La detección de "algo cambió" es genérica (compara `{isEditing, error}` contra el render anterior, mutando un ref durante el render — patrón sancionado por React, no un hack) para que una fila que se cierra *porque se abrió otra* también anime, no solo la fila que recibió el click.
  - `overflow-hidden` va **solo** en el div interno animado y **solo** mientras dura la transición — nunca permanente ni en el wrapper con el borde. Si se pone permanente, cualquier popover que escape la fila (el calendario de `DateField`, por ejemplo) queda cortado.
  - El borde vive en un wrapper con altura `auto` siempre (nunca se le anima el alto a él); el div que se anima no tiene borde propio. Mezclar los dos (aplicarle altura animada al mismo div que tiene el borde) corta visualmente 2-4px del borde por el cálculo de `box-sizing: border-box`.
  - `onTransitionEnd` tiene que filtrar `event.propertyName !== 'height' || event.target !== event.currentTarget` — si no, cualquier transición de color que burbujee desde un ícono hijo (hover del lápiz, por ejemplo) dispara el reset y corta la animación a mitad de camino.
  - `validate?: (value: string) => string | null` (ver `src/lib/validators.ts`, funciones puras sin Firebase/React: `required`, `numeric`, `phone`, `email`, `combine`) bloquea el botón de check y muestra el error en rojo con fade-in debajo del input mientras el usuario escribe.
  - `type?: string` (default `'text'`) pasa directo al `<input>` default (ignorado si `renderInput`/`multiline` lo reemplazan) — `'email'` en los tres campos de correo que usan el fallback (`/patients/[id]`, perfil de admin y correo de clínica en `/config`), para teclado/validación nativa del browser acordes al dato.
  - `value` es lo que se muestra en modo lectura **y** lo que se usa para inicializar el input al editar — si hace falta mostrar un JSX distinto en modo lectura (ej. el usuario enmascarado con el ojito en `/config`), pasar ese JSX en `displayValue` y dejar `value` como el string plano; si no, el input arranca en edición mostrando `[object Object]`.
  - `extraActions` (modo lectura, al lado del lápiz) y `onEdit` (callback al abrir edición, para sembrar estado externo como el `passwordStep` del wizard de contraseña) son los dos puntos de extensión para casos que no son un campo de texto simple.

**`CustomSelect` (`src/components/shared/CustomSelect.tsx`) es el select custom único del proyecto — ya no quedan `<select>` nativos salvo en `/tariffs`** (desactualizado, ver "Sistema visual", se migra cuando le toque su refactor de página completa). Reemplaza: género/obra social/plan en `ModalCreatePatient`, duración/categoría en `AddAppointmentForm`, y por debajo de `SelectField` en `/patients/[id]` y `/config`.
- Portalea el panel a `document.body` (`createPortal`) — nunca lo renderiza inline, porque un ancestro con `overflow-hidden` (cualquier card del sistema visual) recorta a un descendiente `position:fixed`/`absolute` aunque esté posicionado contra el viewport. La posición se calcula con `computePopoverStyle` (`src/lib/popoverPosition.ts`) + el hook `usePopoverAnchor` (`src/hooks/usePopoverAnchor.ts`): clampea contra los bordes del viewport, decide abrir arriba o abajo según el espacio disponible, y oculta el panel (sin desmontar) si el trigger queda tapado por el scroll de un ancestro. `z-index: 9000` fijo (`POPOVER_Z_INDEX`), por encima de cualquier modal del sistema.
- **Cualquier popover nuevo anclado a un trigger (no solo selects) debería reusar estos dos primitivos en vez de reinventar el cálculo de posición a mano** — es la pieza pensada para reutilizarse, no algo interno de `CustomSelect`.
- Animación de entrada direccional: `usePopoverReveal(openUp)` (`src/hooks/usePopoverReveal.ts`) traduce el `openUp` que devuelve `computePopoverStyle` a `animate-popover-rise` (abre hacia arriba, entra "subiendo" desde abajo del trigger) o `animate-popover-drop` (abre hacia abajo, entra "cayendo" desde arriba) — las dos definidas en `tailwind.config.ts`, 0.1s. Es una función pura con prefijo `use*` por convención de ubicación (vive en `hooks/`, se llama incondicionalmente como cualquier hook) pero no usa estado de React internamente. Los tres popups de `MiniCalendar` que no pasan por `CustomSelect` (el date-picker de agenda, `DateField`, el de Nacimiento en `ModalCreatePatient`) aplican la clase a mano porque su dirección de apertura es fija por CSS (`top-10`/`bottom-full`/`top-full`), no calculada — no hace falta el hook ahí.
- Navegación de teclado completa en el trigger (no solo Enter para abrir, como un `<select>` nativo): flecha arriba/abajo resalta la opción siguiente/anterior salteando deshabilitadas con wraparound, Enter/Espacio confirma la resaltada, Home/End saltan a los extremos, Tab cierra sin robar el foco, Escape cierra. El resaltado por teclado sincroniza con el mouse (`onMouseEnter`) y hace scroll automático dentro del panel si queda fuera de vista.
- Props de extensión para "trigger embebido" (usados por `PhoneCountrySelect`, ver abajo): `triggerClassName` (mergea por encima de las clases default del trigger vía `cn`/twMerge, para vivir sin borde propio dentro de otro input compuesto), `leadingContent` (nodo antes del label, ej. una bandera) y `hideSelectedLabel` (el trigger no muestra el texto de la opción elegida, solo `leadingContent` + flecha).
- `PhoneCountrySelect` (`src/components/shared/PhoneCountrySelect.tsx`) reemplaza el `countrySelectComponent` default de `react-phone-number-input` (que renderiza un `<select>` nativo) usando ese slot que la librería ya expone — no hace falta tocar la librería. Vive con `tabIndex={-1}` en `ModalCreatePatient`: el `Tab` desde el campo anterior salta directo al número, sin pasar por el selector de país (sigue operable con mouse).

**`Tooltip` (`src/components/shared/Tooltip.tsx`) es el tooltip anclado único del proyecto — cualquier hint contextual nuevo va acá, no un `title` nativo ni un tooltip ad-hoc.**
- Reusa los mismos primitivos que `CustomSelect`: portalea a `document.body` (mismo motivo, un ancestro con `overflow-hidden` recorta un `fixed` descendiente), `usePopoverAnchor` + `computePopoverStyle` para el clamp/flip contra el viewport y el ocultado si el trigger queda tapado por scroll, y `usePopoverReveal` para la animación direccional (`animate-popover-rise`/`popover-drop`, las mismas keyframes, no hay clases nuevas). `z-index: 9500` (`TOOLTIP_Z_INDEX`), por encima de `POPOVER_Z_INDEX` (9000) — un tooltip puede necesitar mostrarse sobre un `CustomSelect`/`MiniCalendar` ya abierto.
- `side`: `'bottom'` (default, con flip automático hacia arriba si no hay lugar); `'left'`/`'right'` (centrado vertical contra el trigger, sin flip) para un ícono angosto — pensado para cuando el sidebar tenga triggers solo-ícono.
- `width` (solo aplica a `side='bottom'`): `'auto'` por default — el ancho se ajusta al contenido real (medido offscreen antes de posicionar, mismo patrón que `CustomSelect`), sin wrap, para el caso típico de una frase corta. Pasar un número fuerza ese ancho fijo y permite wrap — para una explicación más larga que sí necesita cortar en varias líneas.
- `onlyIfTruncated` — como en `CustomSelect`, mide con `ResizeObserver` y solo dispara si el propio trigger está recortado (`scrollWidth > clientWidth`); la clase que trunca tiene que vivir en el wrapper que este componente renderiza (pasada por `className`), porque es ese nodo el que se mide.
- `clickable` — el trigger ya es una acción (botón/link): no fuerza `cursor-help` sobre el `cursor-pointer` propio del hijo.
- Visualmente es un popover más del sistema (`bg-white border border-gray-200 rounded-lg shadow-lg`, texto `text-gray-700`), no el panel oscuro típico de un tooltip — para no introducir una superficie nueva fuera de los tokens ya definidos.

**`MiniCalendar` (`src/components/appointments/ui/MiniCalendar.tsx`) es el calendario custom único del proyecto** — lo usan el date-picker de `/agenda`, `DateField` y el datepicker de Nacimiento en `ModalCreatePatient`.
- **Siempre 6 filas (42 celdas), rellenas con días reales del mes anterior/siguiente atenuados (`text-gray-300`, clickeables — navegan el mes) en vez de celdas vacías.** Así el alto no cambia entre un mes de 4 semanas visibles y uno de 6 — celdas vacías sin contenido colapsan su fila a 0px (bug real de una iteración anterior: rellenar solo con `null` no alcanza, cada celda vacía necesita el mismo padding/texto que una con día para no colapsar la fila).
- Prop `fill`: por default el calendario tiene alto intrínseco fijo por padding (para popovers flotantes sin altura propia, como los tres de arriba). Con `fill`, en cambio, ocupa el 100% del alto de un contenedor con altura ya definida y reparte las 6 filas de días en fracciones `1fr` (`grid-rows-6`) — lo usa el Calendario del sidebar de `/agenda`, que compite `flex-[60]`/`flex-[40]` (con breakpoint `[@media(min-height:850px)]:flex-[45]`/`[55]` para no verse exagerado en monitores con más alto de viewport CSS) contra "Turnos restantes". Nunca mezclar `fill` con un contenedor de altura no acotada.
- **Blindado contra `value` inválido:** un `Dayjs` de `dayjs(undefined, 'DD/MM/YYYY')` (paciente sin fecha cargada) es "Invalid Date" pero sigue siendo *truthy* — el chequeo tiene que ser `value.isValid()`, no solo `if (value)`, o el cálculo de celdas da `NaN` en cascada (bug real: reventaba el date-picker de Nacimiento en `/patients/[id]` cuando `patient.birthDate` venía vacío).

**`AppointmentsTable.tsx`: cada turno que se pinta entra con `animate-carousel-reveal`** (la misma keyframe que ya usa `SidebarCarousel` para revelar contenido nuevo — opacity + scale 0.96→1 + translateY 4px→0, 0.35s), con un stagger leve por horario (`index * 25ms`, tope 200ms) y `animationFillMode: 'both'` para que no haya un flash a opacidad completa durante el delay. El `div` del turno lleva `key={`${date}-${time}`}` a propósito — sin ese `key`, cambiar de fecha solo actualiza el contenido del mismo nodo DOM (mismo horario, otro paciente) y la animación de entrada, que se dispara por *mount*, no vuelve a jugar. Con la fecha adentro del key, cambiar de día fuerza el remount de todos los turnos visibles; cargar un turno nuevo en un slot vacío ya monta un div que antes no existía, así que entra animado sin necesitar el truco del key. Editar un turno ya cargado (mismo día, mismo horario) a propósito NO re-dispara la animación — el key no cambia, evita repetir la entrada por cada edición. Las filas vacías (sin turno) no llevan esta animación — animar las ~20+ filas de horario sin turno sería ruido visual, no valor.

**Agenda: menú "Acciones" de un turno (click en una fila ocupada, en `agenda/page.tsx`)** — tres acciones: Editar, Recordar por WhatsApp, Eliminar (en ese orden, la destructiva al final).
- **Posicionamiento inteligente, igual que `CustomSelect`** — ya no se posiciona a mano contra `event.pageX/pageY` (`mousePosition`, eliminado). `appointmentAnchorRef` guarda el `<td>` de la fila clickeada (`event.currentTarget` en `handleCliclRow`), `usePopoverAnchor` + `computePopoverStyle` calculan la posición `fixed` real, clampeada contra el viewport y con flip arriba/abajo automático, y el panel se portalea a `document.body` con `POPOVER_Z_INDEX`. La ventaja sobre la versión anterior: si el usuario scrollea la tabla (`overflow-y-auto` de `AppointmentsTable`) mientras el popover está abierto, `usePopoverAnchor` lo oculta (sin desmontar) en vez de dejarlo "flotando" desanclado de la fila que lo abrió. Alto fijo por adelantado (`ACCIONES_PANEL_HEIGHT = 148`, header + 3 ítems) — mismo criterio que `FloatingAnchor` en el odontograma, nunca se mide después de pintar.
- El panel lleva `key={`${appointmentSelect?.date}-${appointmentSelect?.time}`}` — si ya estaba abierto (`openModalAppointment` en `true`) y se clickea otro turno, ese booleano no cambia, así que sin el `key` React reutiliza el mismo nodo en vez de remontarlo y la animación de entrada (dispara por *mount*) no vuelve a jugar. La animación es `animate-popover-drop`/`animate-popover-rise` según `openUp` (la misma familia que ya usan `CustomSelect`/`Tooltip`/`MiniCalendar`) — reemplaza a la vieja `modal-appointment` (bouncy, 0.2s ease-in, sacada de `tailwind.config.ts` por quedar sin uso), que además solo tenía sentido para una apertura única y no para "saltar" de un turno a otro con el popover ya abierto.
- **Reclickear el turno "activo" (el mismo resaltado que usa `AppointmentsTable`, ver más abajo) cierra/cancela en vez de reabrir lo mismo** — ya sea que tenga Acciones abierto sin editar, o que se esté editando. `handleCliclRow` compara `activeAppointment` (la misma variable derivada que alimenta el resaltado) contra el turno clickeado por `date`+`time`; si coinciden, `clean()` + `setOpenModalAppointment(false)` y corta ahí — sin eso, clickear el turno con Acciones ya abierto no hacía nada visible (mismo popover, mismo `key`, no remonta). Si es un turno *distinto* al activo, sigue el comportamiento de siempre: `clean()` cancela lo que hubiera en curso y abre Acciones para el nuevo.
- **Editar reusa `AddAppointmentForm` con la prop `editing`** en vez de un formulario aparte. El paciente queda **fijo a propósito** (decisión de producto, no técnica): el stepper pierde el step "Paciente" (queda Horario → Confirmar), el panel de Paciente en el resumen no muestra el link "Editar", y el form arranca directo en el step "Confirmar" (`useState(editing ? 3 : 1)`) porque horario/paciente/motivo ya están cargados. `handleEditAppointment` (`agenda/page.tsx`) precarga `patient`/`reason`/`observations`/`appointmentDate` con los datos del turno existente y guarda el turno original en `editingAppointment` — con `skipResetHours.current = true` antes de setear `appointmentDate`, mismo mecanismo que ya usaba el efecto de duración, para que el efecto que escucha `[appointmentDate]` no pise `appointmentHours` de vuelta a 1. **El día y el horario de inicio quedan fijos al editar — lo único editable es la duración**, con el mismo `CustomSelect` que ya existía (decisión de producto: reagendar a otro día/horario es un caso distinto, no cubierto por esta feature). Por eso el tacho que en modo alta borra el horario seleccionado (`setAppointmentDate(null)`) no se renderiza cuando `editing`, y `handleCliclRow` (`agenda/page.tsx`) corta temprano con un `return` si `editingAppointment` está seteado — clickear un slot libre de la grilla no reubica nada mientras se edita, a diferencia de crear un turno nuevo. `updateAppointment.ts` igual soporta un cambio de día a nivel de service (por si en el futuro se habilita), pero hoy la UI nunca dispara esa rama.
- **`updateAppointment.ts` (`src/services/appointments/`) es el service de edición** — `setAppointment.ts` sigue siendo solo alta. Si el día no cambió, sobreescribe in-place el mismo id (mismo criterio de `set()` completo que `setAppointment`, así una duración más corta no deja `time2`/`time3` viejos colgando). Si el día cambió, borra el nodo viejo y asigna un id nuevo en el bucket del día nuevo (mismo auto-incremento que `setAppointment`), y **reindexa `/patients/{id}/appointments/`** — ese nodo es un índice de fechas (una entrada por día con turno, no por id de turno; lo lee `getPatientAppointments.ts`), así que si no se saca la entrada vieja y se empuja la nueva, el turno reagendado queda invisible en el historial/resumen del paciente aunque el turno en sí se haya movido bien. `clean()` (`agenda/page.tsx`) ahora también resetea `editingAppointment` — es lo que evita que una edición abandonada a mitad de camino (ej. clickeando la propia fila del turno que se está editando, que dispara `clean()` de nuevo) deje ese estado "pisado" y la próxima alta de turno nueva se mande por error como un `updateAppointment` sobre el turno viejo.
- **"Recordar por WhatsApp" unifica lo que antes eran dos botones mock ("Compartir" y "Recordar Turno")** — mismo destino (`wa.me/<tel>?text=...`), no hacía falta diferenciarlos. `handleShareWhatsApp` limpia el teléfono guardado (`patientData.num`, formato internacional con espacios y `+` de `formatPhoneNumberIntl`) a solo dígitos antes de armar el link — `wa.me` no acepta el `+` ni espacios. Si el paciente no tiene teléfono cargado, toast de error en vez de abrir un link roto.
- **Un recordatorio automático (disparado solo, sin que el admin lo apriete) queda fuera de alcance** — este proyecto es 100% client-side contra Realtime Database, no hay ningún proceso corriendo del lado del servidor. Haría falta una Cloud Function con Scheduler (y probablemente WhatsApp Business API en vez de un link `wa.me`, que necesita interacción humana para disparar el envío) — infraestructura nueva, no un botón nuevo. Anotado acá como pendiente de planificación aparte, no de esta feature.
- **El turno sobre el que está abierto el popover de Acciones, o que se está editando, queda resaltado en la grilla** (`isActive` en `AppointmentsTable.tsx`: `border-l-4 border-l-teal-600 bg-teal-50`, en vez del `border-l-[3px]` + hover normal) — así el usuario sabe con cuál está interactuando, incluso después de cerrar el popover si pasó a "Editar Turno". `activeAppointmentKey` (`agenda/page.tsx`, `${date}-${time}`) se deriva de `editingAppointment ?? (openModalAppointment ? appointmentSelect : null)` — se apaga solo al cerrar el popover sin elegir nada, y se mantiene mientras dura la edición.
- **La columna de horas (`13:30`, `14:00`...) también se resalta para el turno activo**, no solo la fila del turno — mismas clases `bg-teal-50`/`border-teal-200`/texto teal (`TIME_CELL_ACTIVE` en `AppointmentsTable.tsx`). Cubre las 5 franjas del turno (`time`...`time6`), no solo el horario de inicio: los slots secundarios (`time2`...`time6`) tienen su propio `<tr>` sin acceso directo al `appointment` (esa info vive en el `<td>` con `rowSpan` de la franja principal), así que cada uno busca su turno "dueño" — el que lo referencia en `time2`..`time6` — y compara `activeAppointmentKey` contra `${date}-${dueño.time}` para decidir si pintarse activo.
- **Desde adentro de "Editar Turno" también se puede eliminar el turno definitivamente** (`onDelete` en `AddAppointmentForm`, botón rojo bajo "Guardar cambios", mismo token `Destructivo` del sistema visual) — dispara el mismo `ConfirmAlert` que el menú de Acciones, sin un segundo modal de confirmación aparte. Por eso el `onConfirm` de ese `ConfirmAlert` ahora también llama `clean()`: si el turno se borró desde el menú de Acciones el form nunca estuvo abierto (no-op), pero si se borró desde adentro de la edición, sin ese `clean()` el form quedaba abierto mostrando "Guardar cambios" sobre un turno que ya no existe.
- El popover de Acciones es **`w-56`** (antes `w-44`) — a ese ancho angosto, "Recordar por WhatsApp" hacía salto de línea mientras "Editar"/"Eliminar" (una palabra) no, dando un trato visual inconsistente entre ítems del mismo menú. Ese popover no pasa por `computePopoverStyle` (se posiciona a mano contra `mousePosition`, sin clamp de viewport) — si algún ítem futuro necesita más ancho todavía, migrarlo a los primitivos de popover compartidos en vez de seguir agrandando el número a mano.

**Agenda: alta de turno (`AddAppointmentForm.tsx` + `handleCliclRow` en `agenda/page.tsx`)**
- Clickear una fila de la grilla mientras ya hay un horario seleccionado (`appointmentDate` seteado, sea que el form esté en el step 1, 2 o 3) **no cancela el alta** — solo mueve el horario inicial al nuevo slot clickeado, sea el mismo día o navegando a otro día. Paciente, motivo y observaciones quedan como estaban; la duración se resetea sola a 30 min (efecto que escucha `appointmentDate`) y `freeSpaces` se recalcula para el nuevo horario. La única forma de cancelar clickeando en la grilla es re-clickear alguno de los slots ya resaltados/"respirando" (el rango completo que ocupa la duración elegida — `time`, `time2`...`time6` — no solo el horario inicial, mismo chequeo que usa `AppointmentsTable` para decidir qué pintar resaltado). El botón "Cancelar" del header sigue siendo la otra vía.
- El step 3 (Confirmar) tiene 4 paneles + botón de confirmar dentro de un contenedor `flex flex-col overflow-y-auto`. **Cada panel necesita `shrink-0`** — sin eso, `flex-shrink:1` (el default de cualquier hijo flex) los achica para que todos entren en el alto disponible en vez de dejar que el contenedor haga scroll, y como cada panel tiene su propio `overflow-hidden`, el achique se ve como texto cortado a mitad de línea en vez de un layout roto obvio. Mismo criterio en cualquier lista de cards dentro de un contenedor con scroll: los hijos que no deben resignar su alto natural llevan `shrink-0`.
- El wrapper del panel lateral en `agenda/page.tsx` (el que envuelve `AddAppointmentForm` o Calendario+Turnos restantes) necesita `min-h-0` además de `overflow-hidden` — sin eso, el contenido puede forzarlo a crecer más allá del alto disponible en vez de quedarse acotado y dejar que el scroll interno de sus hijos haga el trabajo (mismo principio en cualquier cadena `flex-col` con overflow interno: cada nivel necesita `min-h-0`, no solo el que tiene el `overflow-y-auto` final).

**Agenda: filtro por profesional (`professionalId` en cada turno, selector en `agenda/page.tsx`).** Cada profesional tiene su propia agenda — no es una feature "por si algún día hay más de uno", es el modelo real del cliente (varios sillones en paralelo). Cómo está armado:
- **DB:** `/clinics/{clinicId}/appointments/{fecha}/{id}/professionalId` — el `key` de `/clinics/{clinicId}/pros/{key}`. Mismo bucket de siempre por fecha, no se particionó el árbol por profesional; el filtrado es client-side sobre ese campo. Es schemaless (Realtime Database), no hizo falta ninguna migración de estructura — el campo aparece solo la primera vez que se escribe.
- **El selector (`CustomSelect`, al lado del navegador de fecha) solo se muestra con 2+ profesionales cargados en `pros/`.** Con 0 o 1, cero cambio visual ni de comportamiento respecto a antes de esta feature — ni selector, ni filtrado, ni chip en el form. Es a propósito: la mayoría de las clínicas hoy tienen un solo profesional cargado, y no tiene sentido mostrarles un control que no filtra nada.
- **Todo turno nuevo se tagea con `professionalId` aunque el selector esté oculto** (agarra el único `key` de `pros/` cuando hay exactamente uno) — así, el día que se cargue un segundo profesional en `/config`, los turnos ya existentes del primero no quedan sin dueño y no desaparecen de su vista filtrada. Sin esto, pasar de 1 a 2 profesionales dejaría todo lo cargado antes "huérfano".
- **`visibleAppointments` (`agenda/page.tsx`) es el único array que ve el resto de la página** cuando el filtro está activo — grilla (`AppointmentsTable`), `RemainingAppointments`, el cálculo de `freeSpaces` y el propio `handleCliclRow` (que decide si el slot clickeado ya tiene turno). Es clave que todos consuman esta lista filtrada y no el `appointments` crudo del fetch: como ahora puede haber más de un turno a la misma hora (uno por profesional, sillones en paralelo), sin filtrar antes `appointments.find(a => a.time === time)` puede levantar el turno de **otro** profesional y mostrarlo/editarlo en la agenda equivocada. El fetch a Firebase (`fetchAppointments`) sigue trayendo el día completo sin filtrar — el filtro es solo de lectura en memoria, nunca a nivel de query.
- **El profesional queda fijo por el selector de la agenda antes de tocar cualquier slot — el modal "Agregar/Editar Turno" no lo vuelve a preguntar.** Para que quede claro con qué agenda se está trabajando, `AddAppointmentForm` recibe `professionalName` y lo muestra como chip junto al título del panel (los 3 steps) y de nuevo en el resumen de "Horario" del step Confirmar — mismo criterio en los dos lugares que ya usan chip en el sistema visual. Al editar un turno existente, el `professionalId` que se reescribe es el que ya tenía el turno (`editingAppointment.professionalId`), no el del filtro activo — hoy siempre coinciden porque solo se puede hacer click en turnos ya visibles bajo el filtro, pero es la fuente correcta si en algún momento se habilita reasignar un turno a otro profesional.
- **Se recuerda el último profesional visto, por clínica, en `localStorage`** (`agenda-last-pro-{clinicId}`) — al volver a entrar a `/agenda` arranca ahí en vez de resetear siempre al primero de la lista. Lectura/escritura envueltas en `try/catch` (browser privado o storage bloqueado no debe romper la página, solo no recordar la próxima vez).
- **`getClinicData(clinicId, 'pros')` se pide una sola vez al montar, no es realtime** — mismo criterio que el resto de `/agenda` (ver `SidebarCarousel`). Si se agrega un profesional en `/config` con la agenda ya abierta en otra pestaña, no aparece hasta recargar.

**`ModalCreatePatient` (`src/components/patients/ui/modalCreatePatient.tsx`)**
- Se portalea entero a `document.body` (igual razón que `CustomSelect`: el `overflow-hidden` de la página recorta un `fixed inset-0` descendiente aunque esté posicionado contra el viewport). z-index por encima de la topbar/sidebar (`z-50`/`z-40` en `desktopVersion.tsx`): backdrop `z-[60]`, contenido `z-[65]`; los sub-modales anidados de Obra Social/Plan van todavía más arriba (`z-[70]`/`z-[75]`) para quedar por encima del modal principal.
- El backdrop **no tiene `onClick`** — a propósito: es un form largo, un misclick afuera no debe tirar los datos cargados. Solo "Cancelar" o la X cierran.
- El `<form>` tiene `noValidate` + `onKeyDown` que bloquea Enter — "Crear paciente" solo es clickeable, nunca se dispara por Enter en ningún campo, y la validación nativa del browser (los globos "Completa este campo") está apagada a propósito: `HandleSubmit` valida **todos** los campos obligatorios a mano (Nombre, Apellido, Género, Nacimiento, DNI, Núm. Teléfono, Obra Social) como única fuente de verdad, y lista en el toast (mismo `id` fijo, no apila reintentos) puntualmente qué falta — necesario igual para Género/Obra Social/Nacimiento, que al ser `CustomSelect`/`MiniCalendar` no son controles de formulario reales y el browser no podría validarlos solo.
- Teléfono: alcanza con que `parsePhoneNumber(num)?.nationalNumber` tenga contenido (o sea, que haya algún dígito además del código de país) — **no** se exige que sea un número real válido (`isValidPhoneNumber`/`isPossiblePhoneNumber` de la librería rechazaban números tipeados a mano que no calzaban exacto con el plan de numeración de AR, de forma demasiado estricta para carga administrativa).
- Correo no es obligatorio, pero si se completa se valida formato con el mismo `email` de `@/lib/validators` que usa el resto del proyecto — mensaje de error propio en el toast, no se mezcla con "falta completar" (el campo no está vacío, está mal escrito).

**Sidebar y topbar (desktop)**
- Sidebar `w-40` (160px), topbar `h-14` con `border-b-2` — **56px de alto total, no 58**: con `box-sizing: border-box` (el default de Tailwind vía preflight), el borde queda incluido dentro del `h-14`, no se suma. El offset global que reserva ese espacio vive en un solo lugar, `src/app/layout.tsx`: `mt-[56px] sm:ml-40` sobre el wrapper que envuelve `{children}`. Ese mismo wrapper lleva el **fondo general de la app** (`bg-gray-100` + `min-h` para cubrir la pantalla) — ver "Sistema visual". Cualquier overlay/backdrop fullscreen (`loading.tsx`, `confirmAlert.tsx`, `logOutAlert.tsx`, `HistorialTimeline.tsx`) replica ese mismo valor a mano (`sm:left-40`, `sm:top-[56px]`) porque son `fixed` y no heredan el offset del layout — si el ancho del sidebar o el alto del topbar cambian de nuevo, hay que tocar los dos lugares.
- Si una página necesita su propio alto de contenedor (`h-[calc(100vh-Npx)]`), el número tiene que ser `56`, no `58` ni `68`. `58` fue un error de cálculo (asumía que el borde se sumaba al `h-14`) que estuvo en el repo un tiempo y dejaba una franja de ~2px sin el fondo `bg-gray-100` justo debajo de la topbar en todas las páginas — sutil, pero visible con el zoom o el overlay de un modal encima. `68` era el alto del topbar viejo (antes de compactarlo) y quedó pisoteado en varias páginas antes de eso. El topbar **mobile** (`mobileVersion.tsx`) sigue siendo más alto (68px) y no se tocó — no confundir los tres números.
- **Margen de página estandarizado: `px-4 pt-4 pb-4` (16px, simétrico en las 4 direcciones), siempre.** Ninguna página debería inventar `ml-4 mr-2` ni un componente hijo meter su propio `mx-*`/`mr-*` extra "para separar" — eso fue justamente el bug que hubo que deshacer en Aranceles (`PracticeTable`, `AddPracticeForm`, `PriceAdjustmentPanel` tenían cada uno su propio margen lateral, ninguno coincidía con el del toolbar de arriba). El gap entre elementos dentro de una página se resuelve con `gap-*` en el contenedor flex, no con márgenes sueltos en cada hijo. Ojo con el reverso de esa regla: un hijo invisible (el `<div>` que agrupa modales y alerts) dentro de ese contenedor también recibe el `gap` y agrega margen — ver "Anatomía de página".
- El nav de `desktopVersion.tsx` es una lista de filas (ícono + label, hover con borde blanco, separadores finos entre ítems) — no un rail de íconos colapsado. `Configuración` es un ítem más de esa lista (no vive aparte); el bloque inferior fijo solo tiene Cerrar Sesión + el gear de acceso directo.
- **`UserMenu.tsx`** es el dropdown del usuario en el topbar: cierre por click afuera (`useOutsideClick`) y por Escape, semántica de `<button>` real. Cualquier dropdown nuevo en el proyecto debería copiar este patrón en vez de reinventar el manejo de apertura/cierre a mano.

**`SidebarCarousel.tsx`** — el carrusel de 4 slides al fondo del sidebar, arriba de Cerrar Sesión: turnos de hoy (+ próximos, hasta 3), cumpleaños de los próximos 7 días, pacientes nuevos del mes (hasta 3 nombres) y carga semanal (con rango de fechas y un mini gráfico de barras por día). Cosas a saber antes de tocarlo:
- Es un **slider real**, no un swap de contenido: los 4 slides están en fila dentro de un track (`flex`, ancho `400%`), y lo único que se anima es `transform: translateX()` de ese track — una sola transición CSS (`TRACK_TRANSITION`), sin `setTimeout` copiando duraciones a mano. El drag/swipe suma su offset en vivo sobre la posición ya asentada del slide actual; soltar el gesto solo cambia el índice de slide, la misma transición interpola el resto. El track lleva `items-start` a propósito — sin eso, flexbox estira los 4 slides a la altura del más alto y el alto-por-slide deja de tener sentido.
- El alto del contenedor se anima (`ResizeObserver` sobre el slide activo, o sobre el estado de loading/error) para que cada slide — y el propio loading/error — ocupe solo lo que su contenido necesita, nunca una altura fija compartida.
- **No es realtime.** `getSidebarCarouselData()` (`src/services/navigation/`) hace lecturas puntuales (`get()`, no `onValue()`). Se refresca solo en dos momentos: al montar, y cuando llega el evento `SIDEBAR_CAROUSEL_REFRESH_EVENT` (`sidebarCarouselEvents.ts`). Deliberadamente no hay polling — un service que muta un dato que el carrusel muestra dispara `invalidateSidebarCarousel()` después del write exitoso, así que la actualización es instantánea (no "hasta 15 minutos después") y no hay lecturas de más cuando nada cambió. Cobertura actual, los 5 services que tocan datos que el carrusel muestra: `setAppointment`, `deleteAppointment`, `SetPatients`, `deletePatient` (siempre) y `updatePatient` (solo si el payload toca `birthDate`, `name` o `lastName` — ver `CAROUSEL_RELEVANT_FIELDS` ahí mismo, para no disparar el evento por una edición de teléfono/email/obra social que al carrusel no le importa). **Si se agrega otro service que crea/borra/edita algo que el carrusel muestra, hay que sumarle la misma llamada** — si no, ese dato queda desactualizado hasta el próximo refresh de página.
- `src/services/patients/getAllPatients.ts` es el único service que trae **todos** los pacientes de la clínica sin paginar (a diferencia de `getPatients`, que sí pagina) — lo usan los cálculos de cumpleaños y pacientes nuevos del carrusel. No usarlo para listar pacientes en UI (para eso sigue siendo `getPatients`).

**`/patients`: filtro por obra social, export a Excel y columnas visibles de la tabla.**
- **El filtro por obra social (`selectedInsurance` en `agenda/../patients/page.tsx`) es client-side sobre `allPatients`, igual que el buscador** — no dispara ninguna query nueva a Firebase. `getAllPatientsFull` ya trae toda la clínica una sola vez al montar (ver nota de "Listados con búsqueda" más arriba); las opciones del `CustomSelect` de obra social se derivan de los valores únicos de `patient.insurance` presentes en ese array (`insuranceOptions` en `page.tsx`), no de una lectura aparte de `/insurances/`. Es la misma decisión de fondo que ya está documentada para el buscador: el volumen real no justifica una query indexada, y esto evita otro fetch a Firebase para un dato que el service de pacientes completo ya trae.
- **`isFiltering` (`searchContent` no vacío **o** `selectedInsurance` no vacío) reemplazó a `isSearching` como el flag que decide paginación y mensajes de estado.** Con cualquiera de los dos filtros activos, `Table` muestra el resultado completo sin recortar por `visibleCount` y oculta "Cargar más" — mismo criterio que ya tenía el buscador, extendido para que combinar ambos filtros no reintroduzca el corte de 100 en pantalla.
- **Export a Excel (`ExportPatientsModal.tsx` + `src/lib/exportPatientsToExcel.ts`) exporta siempre `filteredPatients` (el set completo que cumple los filtros activos), nunca `visiblePatients`** (que puede estar recortado por `visibleCount`/"Cargar más"). El modal de confirmación aclara en texto si hay un filtro de búsqueda y/o de obra social activo, y en ese caso deja explícito que se exporta el total que cumple ese filtro, no lo cargado en pantalla — sin filtros, aclara que exporta el total de la clínica. `exportPatientsToExcel` vive en `src/lib/` (no en `services/`) porque es una función pura sobre datos ya en memoria, sin tocar Firebase — arma el workbook con `xlsx` (SheetJS) y dispara la descarga con `XLSX.writeFile`.
  - **La dependencia `xlsx` se instala desde el tarball oficial de `cdn.sheetjs.com`, no desde el paquete `xlsx` de npm** (`package.json`: `"xlsx": "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz"`). La versión publicada en el registro de npm quedó congelada en 0.18.5 con dos CVEs altos sin fix disponible ahí (prototype pollution y ReDoS, ambos al *parsear* un archivo ajeno) — no aplica al caso de uso de este proyecto (solo se genera/exporta, nunca se lee un Excel subido por un usuario), pero la build de SheetJS ya viene parchada igual. Si en algún momento se agrega import de Excel (ver roadmap, hoy descartado), evaluar el riesgo de parsing de nuevo en ese momento.
- **Columnas visibles de la tabla (`ColumnsVisibilityMenu.tsx`) es un dropdown de checks propio, no una segunda instancia de `CustomSelect`** — `CustomSelect` es de valor único (un `onChange(value)` que cierra el panel), acá hace falta multi-toggle sin cerrar entre click y click. Reutiliza igual los mismos primitivos de posicionamiento que `CustomSelect`/`Tooltip` (`usePopoverAnchor` + `computePopoverStyle` + `usePopoverReveal`, portal a `document.body`) para no reinventar el cálculo de posición ni la animación — ver la nota general en "Componentes" sobre por qué cualquier popover anclado nuevo debería apoyarse en esos dos hooks. El checkbox en sí es un `<span>` a medida (no un `<input type=checkbox>` nativo), a propósito, para no meter un control nativo en un sistema que ya no usa ninguno (ver "Antes de crear UI nueva"). El estado de columnas (`visibleColumns` en `page.tsx`) es solo del render de esa sesión — no persiste en `localStorage` ni afecta qué se exporta a Excel, que siempre trae todas las columnas más allá de lo que esté oculto en pantalla.

---

## Sistema visual (UI/UX) — regla obligatoria antes de crear o tocar UI

El proyecto está en medio de una estandarización visual que se hace **una página por vez**. Esta sección es el contrato de cómo se tiene que ver y construir cualquier pantalla. Antes de armar o retocar UI, leerla completa y mirar por arriba las páginas de referencia. No hace falta auditar todo el código.

### Referencias

- **`/patients/[id]` y `/config` son la UI acertada y esperada.** Son la vara con la que se mide el resto.
- **`/patients` (listado) y `/agenda` ya están migradas** a ese mismo lenguaje, y son el ejemplo más completo de la *anatomía de página* (abajo). Para una página nueva con listado o tabla, copiar la estructura de `/patients`.
- `/agenda` **ya no es "la referencia visual base"**, como decía una versión anterior de este archivo. Eso era antes del refactor.

### El concepto

Lo que se busca:

- **Sobrio, con jerarquía por superficies y no por color.** La jerarquía la dan las cards blancas sobre el fondo gris, los bordes finos y la tipografía, no los bloques de color. El teal es **acento** (acción primaria, estado activo, chips), nunca el relleno de un header.
- **Los headers sólidos `bg-teal-600` (#0D9488) de los componentes flotantes quedaron antiguos.** Modales, paneles y cards llevan header sobrio: título negro sobre `bg-gray-50` o blanco, separado del contenido por `border-b border-gray-200`.
- **Contraste suficiente entre la página y sus cards.** Con el fondo en `gray-50` las cards blancas no se despegaban (falta de contraste). Por eso el fondo general es un escalón más oscuro, `gray-100`, y el contenido denso (tablas, listas) va siempre sobre blanco.
- **Estandarizado de verdad:** mismo fondo, mismos márgenes y misma estructura de header y card en todas las páginas. Lo que vale "para todas las páginas" se define **una sola vez** (como el fondo general en `layout.tsx`), nunca copiado en cada `page.tsx`.
- **Se pregunta antes de decidir estructura.** Si una decisión visual cambia la estructura de la página (si lleva header o no, cómo se resuelve el contraste, cómo se trata el color), el agente la plantea con opciones antes de implementar. Los retoques de detalle los decide solo.

### Tokens

| Uso | Clases |
|---|---|
| Fondo general de la app | `bg-gray-100` (#F3F4F6), **solo** en el wrapper de `layout.tsx`. Ninguna página declara fondo propio. |
| Card | `bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden` |
| Header / footer interno de card | `bg-gray-50` + `border-b border-gray-200` (footer: `border-t`), `px-4 py-3` |
| Título de página | `text-2xl font-bold text-black tracking-tight` |
| Título de card o modal | `text-base font-bold text-black tracking-tight`, subtítulo `text-xs text-gray-400` |
| Label de grupo / encabezado de tabla | `text-xs font-bold tracking-widest text-gray-400 uppercase` (en tablas `text-[11px]`) |
| Label de campo | `text-xs font-semibold text-gray-500`, obligatorio con `*` en `text-red-500` |
| Botón primario | `bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-sm font-semibold px-3 py-1.5` |
| Botón secundario / Cancelar | `border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-black rounded-lg` |
| Link de acción | `text-xs font-semibold text-teal-700 hover:text-teal-600` |
| Input / select | `h-9 border-2 border-gray-300 rounded-lg bg-gray-100 text-sm text-black focus:outline-teal-700`, siempre con color de texto explícito (ver pitfall de `text-white`) |
| Toggle segmentado (ej. Nombre / DNI) | contenedor `bg-gray-100 border-2 border-gray-300 rounded-lg p-0.5`; activo `bg-teal-700 text-white shadow-sm`; inactivo `text-gray-500 hover:text-black` |
| Chip / contador | `text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2 py-0.5` |
| Fila de tabla o lista | `border-b border-gray-100`, hover `bg-gray-50`, seleccionada `bg-teal-50` |
| Destructivo | texto `text-red-600`, hover `bg-red-50`, borde `border-red-200` si es botón |
| Avatar de paciente | `AvatarFallback`, el mismo en tabla de pacientes, agenda y ficha |

El primario es **`teal-700`** con hover `teal-600`, no `teal-600` plano como decía la versión anterior de este archivo. `teal-600` queda para bordes de acento (ej. `border-l-teal-600` en un turno de la agenda) y para hovers.

### Anatomía de página

```
<div h-[calc(100vh-56px)] flex flex-col overflow-hidden>      ← sin fondo propio
  {modales, ConfirmAlert, popovers}                            ← FUERA del contenedor con gap
  <div flex flex-col h-full gap-4 px-4 pt-4 pb-4 animate-page-drop>
    <header shrink-0>   Título [chip contador]   ...   [Acción primaria]
    <div flex-1 min-h-0>                                       ← cuerpo (una o más cards)
      <card>
        header interno   (buscador, navegador de fecha, filtros)
        contenido        (flex-1 min-h-0 overflow-y-auto)
        footer interno   (opcional: contador, "Cargar más")
```

- **Header de página:** título a la izquierda, al lado un chip con el contador relevante (pacientes cargados, turnos del día), y la acción principal a la derecha.
- **Los controles de una card van en el header de esa card, no en el header de página.** El buscador de `/patients` y el navegador de fecha de `/agenda` viven arriba de su tabla, dentro de la card.
- **El scroll es interno a cada card** (`flex-1 min-h-0 overflow-y-auto`), nunca de la página entera. Nada de `h-screen` + `pb-44` para empujar el contenido (así estaba `/agenda`).
- **Pitfall: overlays dentro del contenedor con `gap`.** El `<div>` que agrupa modales y alerts no ocupa alto, pero si es hijo del contenedor `gap-4` igual recibe el gap y suma 16px arriba del header. Pasó en `/agenda`: quedaban 32px de margen superior contra los 16px de `/patients`. Todo lo que se renderiza flotando va **antes** del contenedor con gap.
- **Estados vacíos:** ícono gris + título + una línea de ayuda, centrados (ver `table.tsx` de pacientes). No una fila de tabla con texto.

### Componentes flotantes (modales, popovers, paneles)

- Panel `bg-white border border-gray-200 rounded-2xl shadow-xl`, backdrop `bg-black/50`.
- **Estructura fija de modal**, ver `modalCreatePatient.tsx`:
  - header: ícono chico en `bg-teal-50 text-teal-700 border-teal-200 rounded-xl` + título + subtítulo + X para cerrar;
  - cuerpo con scroll propio, agrupado con labels de grupo;
  - footer `bg-gray-50 border-t` con Cancelar (secundario) y la acción (primario), alineados a la derecha.
- Escape cierra: primero el sub-modal abierto, después el principal.
- Textos de botón en tipografía normal (`Cancelar`, `Crear paciente`), nunca en MAYÚSCULAS.
- Popover de acciones (ej. el de un turno en `/agenda`): panel blanco con header `bg-gray-50` + label de grupo, ítems de ancho completo con hover `bg-gray-50`, y la acción destructiva en rojo.
- **El `Sheet` de shadcn no se usa más.** El alta de paciente es un único modal responsive (`max-w-[720px]`, grilla `grid-cols-1 sm:grid-cols-3`, `max-h-full` con scroll interno) para desktop y mobile. El flujo viejo de sheet + carrusel de 3 cards se borró, no reintroducirlo. `shared/ui/sheet.tsx` y `shared/ui/carousel.tsx` siguen en el repo pero hoy no los importa nadie.

### Anti-patrones (lo viejo que se está eliminando)

Si aparece alguno de estos en algo que se toca, se migra al token correspondiente:

- Bordes pesados: `border-2 border-gray-600`, `border-4`.
- Headers sólidos `bg-teal-600` con título grande en blanco, incluida la barra vertical "A G E N D A" que tenía la agenda.
- Botones con `shadow-lg` + `border-b-4 border-b-teal-600` (los "Agregar Paciente/Turno" viejos).
- Botones `bg-red-900 text-red-200` / `bg-teal-600 text-teal-950` en MAYÚSCULAS.
- Superficies e inputs `bg-gray-300 bg-opacity-30/40`.
- Hover oscuro en filas: `hover:bg-gray-900 hover:bg-opacity-30`.
- Márgenes sueltos en los hijos (`ml-10`, `mr-2`) en lugar de `gap-*` en el contenedor.
- Placeholders alineados con espacios (`"Busca un paciente          Por:"`).

### Estado de la migración

| Pantalla / componente | Estado |
|---|---|
| `/patients/[id]`, `/config` | Referencia |
| Sidebar y topbar desktop (`desktopVersion.tsx`) | Refactorizado |
| `/patients` (listado + `modalCreatePatient.tsx`) | Migrado |
| `/agenda` (`AppointmentsTable`, `AddAppointmentForm`, `RemainingAppointments`, `MiniCalendar`) | Migrado |
| **`/tariffs`** (`page.tsx` + `components/practices/ui/`: `PracticeTable`, `AddPracticeForm`, `PriceAdjustmentPanel`) | **Desactualizado.** Concentra la mayoría de los `border-gray-600` y `bg-opacity-30` que quedan en el repo. Es la próxima. |
| `shared/dialogAlerts/confirmAlert.tsx`, `logOutAlert.tsx`, `shared/alert.tsx` | Desactualizado: botones `bg-red-900`, `border-4`. `confirmAlert` se ve desde páginas ya migradas (eliminar turno, eliminar paciente), así que desentona. |
| `navigation/mobileVersion.tsx`, `/notSign` | Desactualizado |

Desvíos conocidos dentro de las propias referencias, a unificar cuando se toquen: `/config` usa `px-6 pt-6 pb-6` en vez del margen estándar `px-4 pt-4 pb-4`, y `/patients/[id]` no envuelve su contenido en una card blanca (se dibuja directo sobre el fondo general).

### Otros recursos

- Componentes base en `src/components/shared/` y `shared/ui/`: `Button`, `Card`, `AlertDialog`, `Toast`, `PageSlide`, `loading`, `confirmAlert`, `logOutAlert`, `AvatarFallback`, `CustomSelect`, `PhoneCountrySelect` (ver "Componentes").
- Animaciones custom en `tailwind.config.ts` (`page-drop`, `move-from-right-form`, `modal-appointment`, `fade-in`, entre otras). Revisar si ya existe una antes de inventar otra.

Dentro de este sistema, el agente tiene libertad para crear componentes nuevos o reusar los existentes.

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

**Roadmap:** responsive completo, odontograma, historia clínica, dashboard de métricas, facturación, chatbot para pacientes, asistente IA para admin, recordatorio de turno automático (ver nota de infraestructura en "Agenda: menú Acciones").