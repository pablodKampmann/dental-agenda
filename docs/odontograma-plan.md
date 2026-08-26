# Odontograma — Plan de la feature

> **Paso 1 de la metodología: planificación. Sin código todavía.**
> Este documento se cierra cuando hay acuerdo sobre el alcance. Recién ahí se redacta el prompt de implementación (Paso 4).

- **Ruta:** `/patients/[id]/odontogram`
- **Nodo nuevo:** `/clinics/{clinicId}/odontogramas/{pacienteId}`
- **Estado actual:** cascarón vacío
- **Migración:** ninguna, arranca de cero

---

## 1. Decisiones cerradas

| | Decisión | Nota |
|---|---|---|
| **Catálogo** | Los básicos primero — 10 hallazgos en la v1 | La estructura contempla los 39 de la norma MINSA para que sumar el resto sea agregar filas |
| **Capas** | Existente y a realizar | Cada hallazgo declara si el paciente ya lo tiene o si hay que hacérselo |
| **Histórico** | Estado vigente + log de eventos | El estado se lee de un tirón; cada cambio deja un asiento que no se edita ni se borra |
| **Dentición** | Permanente, escalable a temporaria | Se renderizan 32 piezas; el modelo y el layout contemplan las 52 |

Las cuatro se sostienen entre sí: la doble capa es lo que le da sentido al rojo y al azul, el log de eventos es lo que convierte al odontograma en historia clínica y no en un dibujo editable, y arrancar por los básicos solo es seguro si la estructura ya contempla el resto — que es lo que hace el catálogo tipado.

---

## 2. Relevamiento (Paso 2)

### Lo que existe

- La ruta `/patients/[id]/odontogram` resuelve, y la solapa **Odontograma** ya está en `patientRecord.tsx` junto a Historia Clínica.
- Aranceles tiene 10 capítulos cargados: CONSULTAS, OPERATORIA DENTAL, ENDODONCIA, PRÓTESIS, ODONTOLOGÍA PREVENTIVA, ORTODONCIA Y ORTOPEDIA FUNCIONAL, ODONTOPEDIATRÍA, PERIODONCIA, RADIOLOGÍA, CIRUGÍA. Son el destino natural de los hallazgos «a realizar» cuando exista presupuesto.
- Hay un nodo `/professionals` con el plantel de la clínica.

### Lo que no existe

- **`odontogramData` no existe.** Figura en el árbol de `AGENTS.md` como referencia, pero ningún servicio lo lee ni lo escribe. No hay datos que migrar.
- **La página es un cascarón.** Carga el paciente, dibuja el `PatientRecord` y una caja con un `<Image>` apuntando a `/46cd610bbe30d71e851afa6c9a9f2e8a.svg`, archivo que **no está en `public/`**. Se reescribe entera.
- **Usa el patrón viejo.** Resuelve la sesión con `getUser(true)` + `onAuthStateChanged` a mano e importa con rutas relativas. `/tariffs` ya migró a `useAuth()` y `useToast`.
- **Los turnos no guardan el profesional.** Un turno tiene `patientId`, `time`, `reason` y `observations`. Ver preguntas abiertas.

---

## 3. Numeración FDI

Dos dígitos: el primero es el cuadrante, el segundo la posición desde la línea media. La pieza `16` se lee «uno-seis».

En Argentina es obligación legal: la **Ley 26.812**, que sustituyó el art. 15 de la Ley 26.529, exige individualizar las piezas «según el sistema dígito dos o binario» = FDI / ISO 3950.

### Layout — vista del observador

La hemiarcada **derecha del paciente se dibuja a la izquierda**, igual que en una panorámica.

```
        ← DERECHA del paciente        |        IZQUIERDA del paciente →

SUPERIOR  18 17 16 15 14 13 12 11     |     21 22 23 24 25 26 27 28
              — cuadrante 1 —         |       — cuadrante 2 —
────────────────────────────────────────────────────────────────── plano oclusal
INFERIOR  48 47 46 45 44 43 42 41     |     31 32 33 34 35 36 37 38
              — cuadrante 4 —         |       — cuadrante 3 —
```

Los cuadrantes se numeran en sentido horario: 1 → 2 → 3 → 4. La numeración crece alejándose de la línea media, así que **decrece** de izquierda a derecha en los cuadrantes 1 y 4.

> **Trampa:** nunca derivar la posición en pantalla ordenando por código FDI ascendente — rompe en los cuadrantes 1 y 4. La tabla de piezas guarda un `ordenVisual` precalculado del 1 al 16 por fila.

**Temporaria** (no se renderiza en v1, pero el generador de posiciones la contempla): cuadrantes 5 a 8, cinco piezas cada uno (`51`–`55`, `61`–`65`, `71`–`75`, `81`–`85`), dibujados como dos filas internas. Ojo: **los temporarios no tienen premolares** — 54, 55, 64, 65, 74, 75, 84 y 85 son molares temporarios.

---

## 4. Las cinco caras

| Cara | Cómo se llama | Dónde está |
|---|---|---|
| M | Mesial | Mira hacia la línea media |
| D | Distal | Mira alejándose de la línea media |
| V | Vestibular — bucal en posteriores, labial en anteriores | Hacia la mejilla o el labio |
| L / P | Lingual en las inferiores, palatino en las superiores | La cara interna |
| O / I | Oclusal en molares y premolares, incisal en incisivos y caninos | La superficie de masticación |

Un hallazgo puede abarcar varias caras y se nombra combinando iniciales: `MO`, `OD`, `MOD`.

### La inversión de mesial y distal

Es el error número uno en odontogramas digitales. Mesial es siempre la cara que mira a la línea media, y la línea media está en el centro del dibujo:

| Cuadrantes | Mitad del gráfico | Trapecio izquierdo | Trapecio derecho |
|---|---|---|---|
| 1 y 4 | izquierda | **Distal** | **Mesial** |
| 2 y 3 | derecha | **Mesial** | **Distal** |

O sea: la pieza 16 y la 26 se dibujan idénticas, pero su cara mesial está en polígonos opuestos.

**Regla:** los datos guardan el valor semántico (`MESIAL`, `DISTAL`, `VESTIBULAR`, `LINGUAL_PALATINO`, `OCLUSAL_INCISAL`) y la presentación resuelve qué polígono le toca según el cuadrante. Nunca guardar «trapecio izquierdo». Lo mismo con lingual/palatino: un solo valor canónico, etiqueta según arcada.

---

## 5. Rojo y azul

> **⚠️ Corregido con la ficha en papel de la odontóloga (foto del 25/08).** La convención de la clínica es la **inversa** de la norma MINSA. Manda el papel: es el formulario real del cliente.

La ficha dice, textual:

```
REFERENCIAS
COLOR ROJO: Prestaciones existentes
COLOR AZUL: Prestaciones requeridas
```

O sea: **rojo = lo que el paciente ya tiene. Azul = lo que hay que hacerle.** Al revés de lo que dice la norma técnica peruana y de lo que decía la versión anterior de este documento.

Esto valida la decisión de **no persistir el color**: la inversión es un cambio de una línea en la función que lo deriva, y ningún dato guardado cambia. Si se hubiera guardado el color, sería una migración.

El modelo se simplifica, además. El papel no registra «buen estado / mal estado» ni «definitivo / provisorio»: solo las dos condiciones. Queda un eje:

```ts
condicion : 'EXISTENTE' | 'REQUERIDA'

color = condicion === 'EXISTENTE' ? ROJO : AZUL
```

Cuando una prestación requerida se ejecuta, pasa a existente. Esa transición es un evento del log — que es exactamente para lo que sirve el log.

Los ejes `estado` y `temporalidad` que proponía la versión anterior salen de la v1. No los usa el papel y no los pidió nadie; si aparecen después, se agregan como campos opcionales sin tocar lo ya guardado.

---

## 6. El catálogo de hallazgos

> **⚠️ Reescrito con la ficha en papel (foto del 25/08).** El vocabulario real de la odontóloga son **seis símbolos** más el relleno de caras. Ni los 39 de MINSA ni los 10 que habíamos elegido: es otra lista, y dos de sus entradas son multi-pieza.

La ficha lista, textual:

```
1  x   (Azul)  p. no erupcionada
2  =   (Azul)  Extracción
3  x   (Roja)  Pieza ausente
4  ▭          PROTESIS FIJA
5  ▭          PROTESIS REMOVIBLE
6  ○          CORONAS
```

Más la regla general de color sobre las caras: una cara rellena en rojo es una prestación existente, en azul una requerida.

### Catálogo v1

| # | Hallazgo | Alcance | Grafismo | Condición por defecto |
|---|---|---|---|---|
| 1 | Caries | cara | Cara rellena | requerida (azul) |
| 2 | Obturación / restauración | cara | Cara rellena | existente (rojo) |
| 3 | Pieza ausente | diente | Aspa **×** | existente (rojo) |
| 4 | Extracción | diente | Signo **=** | requerida (azul) |
| 5 | Pieza no erupcionada | diente | Aspa **×** | requerida (azul) |
| 6 | Corona | diente | Circunferencia **○** | ambas |
| 7 | Prótesis fija | **multi** | Rectángulo abarcando las piezas | ambas |
| 8 | Prótesis removible | **multi** | Rectángulo abarcando las piezas | ambas |

Tres observaciones que salen de leer el papel:

- **Caries y obturación son la misma marca en el papel** — una cara rellena, y el color dice cuál es. Acá se separan en dos entradas del catálogo porque es lo que la odontóloga dice en voz alta y lo que después mapea contra el tarifario, pero **se dibujan igual**: cara rellena. Visualmente la pantalla queda idéntica al papel.
- **Ausente y no erupcionada son las dos un aspa**, distinguidas solo por el color. El componente tiene que soportar que dos hallazgos distintos compartan grafismo.
- **Las prótesis son multi-pieza y están en el uso diario.** En la versión anterior las había mandado a Fase 2. Eso estaba mal: el nodo `vinculos` y la selección de varias piezas entran en la v1.

### Lo que queda afuera y por qué

Endodoncia, implante, sellante, remanente radicular y fractura **no están en la ficha**. Los había puesto en el núcleo por ser clínicamente frecuentes, pero esta odontóloga no los anota en el odontograma. Quedan declarados en el catálogo como extensión, sin implementar.

La lista de 39 de la norma MINSA sigue siendo la referencia para crecer: el catálogo se diseña con los mismos campos (`alcance`, `grafismo`, `condicionPorDefecto`) para que sumar entradas sea agregar filas.

### Dentición temporaria

**La ficha en papel la tiene**: dos filas internas con las 20 piezas (55–51 / 61–65 arriba, 85–81 / 71–75 abajo). La decisión del equipo fue arrancar por permanente, y se mantiene — pero vale saber que la odontóloga la usa, así que es lo primero que va a pedir. Las constantes generan las 52 posiciones desde la Iteración B1, así que encenderla es un cambio de render, no de datos.

---

## 7. Modelo de datos

```
/clinics/{clinicId}/odontogramas/{pacienteId}/

  actual/                        ← lo que se lee al abrir la pantalla
    meta/    { updatedAt, updatedBy, schemaVersion: 1 }
    dientes/
      t16/
        estado: "presente"
        caras/  { O: { tipo: "caries", condicion: "EXISTENTE", ... } }
        notas:  "..."
      t46/ { estado: "ausente", causa: "DEX" }
    vinculos/                    ← puentes, diastemas, prótesis (alcance multi)
      {pushId}: { tipo: "protesis_fija", piezas: { t45: "pilar", t46: "pontico", t47: "pilar" } }

  eventos/                       ← append-only, nunca se edita ni se borra
    {pushId}: { ts, uid, diente: "t16", cara: "O", de: "sano", a: "caries", capa: "existente" }

  snapshots/                     ← opcional, una foto al cerrar cada consulta
    {pushId}: { ts, uid, motivo: "cierre-consulta", dientes: { ... } }
```

Tres razones detrás de esa forma:

1. **Solo se persiste lo anómalo.** No se guardan las cinco caras sanas de los 32 dientes. Un odontograma típico pasa de kilobytes a cientos de bytes.
2. **`eventos` es hermano de `actual`, no hijo.** En Realtime Database leer un nodo trae todos sus hijos: anidarlos haría que cada apertura descargue el historial completo.
3. **Los vínculos son entidades propias.** Un puente no le pertenece a ninguna de las piezas que une.

### ⚠️ Trampa de Firebase — el prefijo `t` no es cosmético

Si todas las claves de un nodo son enteras y la mayor es menor al doble de la cantidad, el SDK **convierte el objeto en un array de JavaScript** al leerlo. Con las 32 piezas permanentes: 32 claves, la mayor es 48, `48 < 64` → `snapshot.val()` devuelve un **array de 49 posiciones con 17 huecos**. Peor: con pocos dientes cargados devuelve un objeto, o sea que *la forma del dato cambia según cuántos hallazgos haya*.

Por eso las claves son `t11`, `t12`, … `t48`.

> Vale mirarlo en lo que ya existe: `/patients` usa claves `1..N` y cae exactamente en esa conversión. Hoy no rompe porque todo el código lo recorre con `Object.keys()`, que funciona igual sobre un array. Es una bomba con la mecha larga.

### Cómo se escribe un cambio

Un solo `update()` multi-path escribe el estado nuevo y el asiento de auditoría de forma atómica:

```ts
const base = `clinics/${clinicId}/odontogramas/${pacienteId}`;
const eventoKey = push(child(ref(db), `${base}/eventos`)).key;

await update(ref(db), {
  [`${base}/actual/dientes/t16/caras/O`]: { tipo: 'caries', condicion: 'EXISTENTE' },
  [`${base}/actual/meta/updatedAt`]: serverTimestamp(),
  [`${base}/actual/meta/updatedBy`]: uid,
  [`${base}/eventos/${eventoKey}`]: {
    ts: serverTimestamp(), uid, diente: 't16', cara: 'O', de: null, a: 'caries',
  },
});
```

Dos detalles que no son opcionales:

- **`serverTimestamp()`, nunca `Date.now()`.** El reloj del cliente no es confiable y en una historia clínica eso tiene consecuencias legales.
- **La inmutabilidad se declara en las Security Rules**, no en el cliente. Todo el código de este proyecto corre en el browser, así que cualquier garantía que viva ahí es decorativa.

```json
"eventos": {
  "$evt": {
    ".write": "!data.exists()",
    ".validate": "newData.hasChildren(['ts','uid','diente'])"
  }
}
```

Corregir un error **agrega un evento de rectificación**; nunca borra el anterior.

Sobre `snapshots`: los eventos alcanzan para auditar, pero reconstruir cómo estaba la boca en la visita 47 obliga a replicar todo el log. Una foto al cerrar cada consulta cuesta ~1 KB y convierte esa consulta en una sola lectura. No es imprescindible para la v1; el nodo queda reservado.

---

## 8. Arquitectura de UI

### SVG geométrico, un `<svg>` por diente

Cada pieza es su propio SVG de cinco polígonos; el layout del arco lo resuelve un grid de Tailwind. Frente a canvas, sprites o divs con `clip-path`, es el único enfoque que gana a la vez en las tres cosas que importan: click por cara nativo (cada polígono es un nodo del DOM con su handler), exportación vectorial a PDF, y tests con Testing Library sobre nodos reales.

Un SVG por diente en vez de uno gigante: el arco se acomoda con grid y wrapping real en mobile, cada diente aísla su re-render, y los nodos son menos de 200 en total.

Geometría: cuadrado con las diagonales, inset del 28 % del lado. Los anteriores llevan cuatro caras (no tienen oclusal).

### Interacción y accesibilidad

32 dientes × 5 caras = 160 paradas de tabulación. Inusable. El patrón es **roving tabindex a nivel de diente**: una sola pieza tabulable, flechas para moverse, Enter abre un **popover de Radix** (ya está en el proyecto) con las cinco caras como botones HTML reales más el selector de hallazgo.

Resuelve tres cosas de una: accesibilidad de teclado y lector de pantalla, targets táctiles decentes en mobile (los trapecios miden ~12 px de alto y WCAG pide 24), y tests triviales. El click con mouse sobre el polígono sigue funcionando como atajo.

### Estado y performance

160 polígonos no son un problema de renderizado. El problema es de arquitectura de estado.

**Anti-patrón a evitar:** pasarle a los 32 dientes el array completo de hallazgos y filtrarlo dentro de cada uno. El `memo` no sirve para nada — cualquier cambio crea un array nuevo, falla la comparación referencial y re-renderizan los 32, cada uno recorriendo la lista entera.

**Forma correcta:** normalizar como `Record<ToothId, ToothState>` y pasarle a cada diente solo su entrada. Las actualizaciones reemplazan únicamente la clave tocada, con lo cual las otras 31 conservan su identidad referencial. El hover vive dentro del diente o se resuelve con CSS puro — jamás en el estado global.

### Exportación a PDF

pdfme tiene un schema type `svg` que dibuja vectorialmente. El camino es una función pura `renderOdontogramaSvg(estado): string` que no toca el DOM, usada en dos lugares: el componente React para la pantalla, y el generador de PDF pasándole el string a pdfme. El PDF deja de depender de que el componente esté montado y se puede testear por snapshot.

Reglas de dibujo que impone: `fill` y `stroke` como atributos con hex literal (el parser ignora las clases de Tailwind), y nada de gradientes, `clipPath`, `use` ni `defs` — no los renderiza. Otro argumento a favor de la geometría plana sobre los SVG anatómicos, que suelen venir con gradientes y saldrían sin relleno.

### Estandarización visual

`AGENTS.md` lo pone como regla obligatoria, así que vale dejarlo anotado. El lenguaje del proyecto para una caja de contenido es el de la propia ficha del paciente: borde `border-2 border-gray-300` con `rounded-xl`, cabecera en `bg-gray-50`, solapas en `bg-gray-100` con la activa en `bg-white text-teal-700`. Las páginas entran con `animate-page-drop` y usan márgenes `ml-4 mr-2 p-4`, como `/agenda`.

El stub actual no sigue nada de eso: `border-gray-600` y una barra de título en `bg-teal-600` a todo lo ancho que no aparece en ninguna otra pantalla. Un argumento más para reescribirlo en vez de completarlo.

---

## 9. Flujo de pantallas

No hay pantallas nuevas: el odontograma vive donde ya está la solapa, dentro de la ficha del paciente. Antes del flujo conviene mirar cuánto espacio es «ahí adentro».

### El espacio real

`layout.tsx` envuelve toda la app en `w-full h-screen overflow-y-hidden` y corre el contenido con `mt-[68px] sm:ml-56`. Dos consecuencias: la aplicación **no scrollea a nivel documento** (cada pantalla se arregla sola, y hoy la mayoría corta), y al odontograma le queda el rectángulo que sobra después de un header fijo de 68 px y una sidebar fija de 224 px.

Presupuesto en un notebook de 1366 × 768:

| | |
|---|---|
| Ancho útil | 1366 − 224 sidebar − ~56 padding ≈ **1086 px** |
| Alto útil | 768 − 68 header − 24 pt-6 − ~150 PatientRecord+solapas − 16 ≈ **510 px** |
| Por pieza | 1086 / 16 ≈ **~60 px** — por encima del piso de 48 px que necesitan las caras |
| Alto de la arcada | 2 filas × ~100 px (caja + número + zona radicular) ≈ **230 px** |
| Sobra | ~280 px para toolbar, leyenda, conmutador de capas e historial |

Entra, con poco margen. **El piso duro de la arcada completa es 16 × 48 = 768 px más padding: por debajo de unos 1050 px de viewport deja de entrar.**

> **⚠️ Mobile no entra.** A 375 px tocan 23 px por pieza — no es que se vea apretado, es inclickeable. El hook `useMediaQuery("(min-width: 768px)")` ya existe pero hoy **solo lo usa la agenda**, así que no hay patrón para copiar. Ver preguntas abiertas.

Dos detalles del entorno que muerden si no se saben:

- El `body` tiene `bg-white text-white`. El color de texto por defecto es **blanco**, así que el componente de diente tiene que declarar el suyo o los números salen invisibles.
- Como el documento no scrollea, si el panel de historial va al costado, **ese panel scrollea solo**.

### El flujo

1. Se entra por la solapa **Odontograma** de la ficha del paciente. Arriba queda el `PatientRecord` como en las otras solapas.
2. Se ve el **arco completo** con las 32 piezas y sus hallazgos dibujados. Un conmutador cambia entre ver lo existente, lo planificado, o ambas capas superpuestas.
3. Se hace **click en una cara o en un diente** y se abre el popover con el catálogo filtrado por alcance.
4. Se elige el hallazgo, su condición (existente / a realizar), su estado y, cuando corresponde, el material. El dibujo se actualiza al instante y el guardado va contra Firebase con feedback por `Toast`.
5. Se **corrige** volviendo a abrir el popover. Por debajo eso no borra: agrega un evento de rectificación.
6. Se **consulta el historial** desde un panel lateral con los asientos en orden cronológico inverso.

Los hallazgos multi-pieza (puentes, prótesis, diastemas) no entran por el popover de un diente sino por un modo de selección aparte: se eligen las piezas y después el tipo de vínculo. Eso es Fase 2.

---

## 10. Fases de entrega

Cada fase deja algo que funciona y se puede mostrar, y ninguna obliga a rehacer la anterior.

### Fase 0 — Cimientos *(sin UI, una rama, un PR)*

- Constantes de piezas FDI con cuadrante, tipo, arcada y `ordenVisual`, generadas para las 52 posiciones aunque se rendericen 32.
- Tipos de hallazgo, cara, condición y estado.
- El catálogo de 39 como constante tipada, con alcance y grafismo declarados.
- Servicios de lectura y escritura contra el nodo nuevo, siguiendo el patrón de `src/services/`.
- Security Rules del nodo `eventos`.
- Tests de los servicios y de la función que resuelve mesial/distal por cuadrante.

### Fase 1 — El odontograma se ve y se edita *(la entrega que vale)*

- Componente de diente en SVG con cinco caras, cuatro en los anteriores.
- Grid del arco completo, responsive, con la perspectiva del observador bien resuelta.
- Popover de Radix con el catálogo filtrado por alcance y roving tabindex entre piezas.
- Los 10 hallazgos del núcleo, incluido el mecanismo de sigla en el recuadro.
- Doble capa con el conmutador existente / a realizar / ambas — y con eso, extracción indicada sale sola.
- Escritura con `update()` multi-path y el log de eventos andando.
- Reescritura de la página con `useAuth()`, `useToast` y alias `@/`.

### Fase 1+ — Los trece de sigla *(PR chico, en cualquier momento después de la Fase 1)*

- Trece filas más en la constante del catálogo. No hay componente nuevo ni cambio de modelo: el mecanismo de sigla ya existe desde la Fase 1.
- Es el escalón que conviene tener a mano si sobra tiempo antes de una demo — sube el catálogo de 10 a 23 casi sin costo.

### Fase 2 — Vínculos entre piezas

- Modo de selección múltiple de piezas.
- Nodo `vinculos` y su dibujo por encima del arco: prótesis fija, parcial removible, completa, edéntulo total, diastema, transposición.

### Fase 3 — Cola larga *(recortable si aprieta el calendario)*

- Los 10 hallazgos de simbología especial: flechas curvas, zig-zags, circunferencias.
- Dentición temporaria y mixta: dos filas internas, 20 piezas más.
- Exportación a PDF con pdfme.
- Panel de historial con la línea de tiempo.

> **Paso 6 de la metodología:** si una fase agrega un patrón, una decisión de arquitectura o un nodo de Firebase nuevo, `AGENTS.md` se actualiza **antes** del commit. La Fase 0 agrega un nodo entero, así que ese PR toca el archivo sí o sí.

---

## 11. Riesgos

| Riesgo | Mitigación |
|---|---|
| **El alcance.** El odontograma completo no entra en un cuatrimestre con un equipo de tres. | La v1 son 10 hallazgos y ya es un odontograma presentable. Todo lo demás está declarado pero no implementado, y cada fase posterior se recorta sin romper nada. |
| **El array de Firebase.** Silencioso, intermitente, aparece recién con suficientes dientes cargados. | Prefijo `t` desde el primer commit, y un test que lea un nodo con 32 piezas y verifique que el resultado es un objeto. |
| **Mesial/distal invertidos.** Produce datos clínicamente falsos sin error visible. | Una única función que traduce cara semántica → polígono según cuadrante, con test de las cuatro combinaciones. |
| **El ancho.** La arcada deja de entrar por debajo de ~1050 px de viewport, y en mobile no entra de ninguna manera. | Definir el patrón mobile antes de la Fase 1. En desktop, ancho mínimo de pieza de 48 px y que el contenedor scrollee en horizontal antes que encoger las caras. |
| **La página vieja.** Patrón de auth anterior e imagen rota. | Se reescribe completa en la Fase 1, no se parchea. |
| **Performance por estado mal normalizado.** No se nota con pocos hallazgos, sí con la boca llena. | `Record` por diente desde el principio; hover fuera del estado global. |
| **El PDF.** pdfme ignora gradientes, `clipPath` y clases CSS, en silencio. | Geometría plana con atributos hex literales. Multi-estado en una cara se resuelve partiendo polígonos, no recortando. |

---

## 12. Preguntas abiertas

Ninguna bloquea la Fase 0. Las tres primeras conviene cerrarlas antes de la Fase 1: la de mobile cambia el layout, las otras dos cambian el modelo.

**¿Qué pasa en mobile?**
La arcada completa no entra por debajo de ~1050 px de viewport, y a 375 px es inclickeable. Opciones: scroll horizontal de la arcada, vista por cuadrante con selector de cuatro, o lista de piezas con sus hallazgos en texto. La tercera es la más accesible y la que menos se parece a un odontograma. Conviene saber si la clínica lo va a usar desde el celular o solo desde la computadora del consultorio — si es lo segundo, alcanza con un «abrilo en pantalla grande».

**¿Quién firma cada asiento?**
La ley pide identificar al profesional interviniente y su matrícula. Hoy los turnos no guardan el odontólogo, aunque existe `/professionals`. Opciones: guardar el usuario logueado (puede ser la secretaria), pedir que se elija el profesional al abrir el odontograma, o resolverlo de fondo agregando profesional al turno.

**¿El odontograma genera presupuesto?**
Un hallazgo «a realizar» es conceptualmente una línea de presupuesto, y aranceles ya tiene los capítulos con precios. Vincular tipo de hallazgo con práctica del tarifario es potente y es bastante más trabajo. Si la respuesta es sí, conviene que el catálogo lleve el vínculo declarado desde la Fase 0 aunque no se use todavía.

**¿Hace falta el PDF en la v1?**
La ley obliga a entregar copia de la historia clínica dentro de las 48 h si el paciente la pide. Está en Fase 3; si el cliente lo considera imprescindible, sube de prioridad.

**¿La historia clínica va junto o después?**
`/patients/[id]/clinicHistory` hoy renderiza literalmente «hola». Odontograma e historia clínica son piezas del mismo documento legal y comparten el log de eventos. Juntas es más coherente; separadas es más entregable.

**¿Se congela el odontograma inicial?**
El modelo clínico de manual dice que el de la primera consulta queda inmutable y encima corre el evolutivo. La decisión tomada (estado vigente + log) cumple la trazabilidad sin esa ceremonia. Queda anotado por si el cliente lo pide: el log permite reconstruirlo después, así que no es una puerta que se cierre.

---

## 13. Fuera de alcance

- **Periodontograma.** Sondaje, sangrado, recesión, furcación. Otra ficha, otra grilla, seis mediciones por diente.
- **Presupuestos y facturación.** Aun si se vinculan hallazgos con aranceles, generar y facturar es otra feature.
- **Imágenes.** Adjuntar radiografías o fotos intraorales a una pieza. Storage ya está en el stack, pero es alcance aparte.
- **Firma digital.** La Ley 25.506 aplica a la HC informatizada. El log de eventos es el cimiento; la firma criptográfica es un proyecto en sí.
- **Interoperabilidad.** Exportar en HL7 FHIR o formato de cotejo forense. Vale que el modelo no lo impida, no que se implemente.
- **Edición simultánea.** Dos profesionales sobre la misma boca a la vez. El `update()` multi-path resuelve por path, que en la práctica alcanza.

---

## Fuentes

- [Ley 26.812](https://www.argentina.gob.ar/normativa/nacional/ley-26812-207587/texto) — obliga al sistema dígito dos en la HC odontológica
- [Ley 26.529](https://www.argentina.gob.ar/normativa/nacional/ley-26529-160432/texto) — inalterabilidad, conservación 10 años, copia en 48 h
- [Norma Técnica del Odontograma — MINSA Perú](https://ccdp.org.pe/wp-content/uploads/2024/03/Norma-Tecnica-del-Odontograma.pdf) — la referencia de simbología más detallada de la región
- [Manual del módulo de Salud Bucal del SIHCE](https://www.minsa.gob.pe/sihce/manualess/MU_SALUD_BUCAL.pdf) — la lista de los 39 hallazgos
- [Notación FDI](https://en.wikipedia.org/wiki/FDI_World_Dental_Federation_notation) — cuadrantes y vista del observador
- [Firebase — Structure Your Database](https://firebase.google.com/docs/database/web/structure-data)
- [Best Practices: Arrays in Firebase](https://firebase.blog/posts/2014/04/best-practices-arrays-in-firebase/) — por qué las claves enteras se convierten en array
- [pdfme — Supported Features](https://pdfme.com/docs/supported-features) — el schema `svg` y sus límites
