# Issues del odontograma — para pegar a mano en GitLab

Adaptadas a la convención del tablero: título en inglés, label de scope con barra,
label de tipo, y `Sprint #N` cuando la agendes.

| | |
|---|---|
| **Scope** | `/odontogram` — como `/tariffs` y `/config`. Podés usar `/patients` si preferís el top-level, pero el módulo vive en `src/lib/odontograma/` y `src/services/odontograma/`, no en la página de pacientes |
| **Tipo** | `feat`, `chore` o `docs`, según la issue |
| **Sprint** | `Sprint #N`, la agregás vos al planificar |

La iteración no lleva label: ya está en el prefijo del título (`B1-1 ·`), así que filtrás
buscando `B1-` y no ensuciás la lista de labels con cuatro más.

Los `- [ ]` de los criterios GitLab los renderiza como task list con contador de progreso.
No los conviertas a viñetas al pegar.

---

## Índice

| Issue | Título | Tipo |
|---|---|---|
| `B1-1` | Add FDI tooth table with explicit visual order | `feat` |
| `B1-2` | Add odontogram domain types | `feat` |
| `B1-3` | Add findings catalog | `feat` |
| `B1-4` | Resolve tooth faces per quadrant and derive layer color | `feat` |
| `B1-5` | Add view selectors for the odontogram state | `feat` |
| `B2-1` | Define odontogram node and append-only security rules | `feat` |
| `B2-2` | Read the odontogram from Realtime Database | `feat` |
| `B2-3` | Write findings with atomic multi-path update and audit event | `feat` |
| `B2-4` | Add multi-tooth links for fixed and removable prosthetics | `feat` |
| `B2-5` | Read the odontogram event history | `feat` |
| `B3-1` | Add odontogram seed button in `/dev` | `chore` |
| `B3-2` | Cover odontogram services with tests | `chore` |
| `B3-3` | Document the odontogram module in AGENTS.md | `docs` |
| `B4-1` | Enforce dentition rules for primary teeth | `feat` |
| `B4-2` | Treat exfoliation and eruption as two separate teeth | `docs` |
| `B4-3` | Add mixed-dentition seed for a pediatric patient | `chore` |

══════════════════════════════════════════════════════════════════════════════
ISSUE 1 DE 16  ·  B1-1  ·  Constantes de las piezas FDI
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B1-1 · Add FDI tooth table with explicit visual order

**LABELS**

    /odontogram, feat

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   feat/odontograma-piezas-fdi
Toca:   src/lib/odontograma/piezas.ts (nuevo)
        src/__tests__/lib/odontograma/piezas.test.ts (nuevo)
Depende: —
```

**Qué hace.** Genera la tabla de las 52 posiciones dentarias con todo lo que la UI y los servicios necesitan para ubicarlas y nombrarlas.

Por cada pieza: `codigo` (11–48 y 51–85), `clave` (`t` + código), `cuadrante` (1–8), `posicion` (1–8 permanentes, 1–5 temporarias), `denticion` (`PERMANENTE` | `TEMPORARIA`), `arcada` (`SUPERIOR` | `INFERIOR`), `hemiarcada` (`DERECHA` | `IZQUIERDA`), `tipo` (`INCISIVO` | `CANINO` | `PREMOLAR` | `MOLAR`), `fila` (1–4, como el papel), `ordenVisual` (posición dentro de su fila) y `columna` (1–16, la grilla común a las cuatro filas).

**Criterios de aceptación**

- [ ] Ordenando por `fila` y `ordenVisual`, la fila 1 da exactamente `18 17 16 15 14 13 12 11 21 22 23 24 25 26 27 28` y la fila 2 `48 47 46 45 44 43 42 41 31 32 33 34 35 36 37 38`.
- [ ] Las filas 3 y 4 dan `55 54 53 52 51 61 62 63 64 65` y `85 84 83 82 81 71 72 73 74 75`.
- [ ] Las piezas 54, 55, 64, 65, 74, 75, 84 y 85 tienen `tipo: 'MOLAR'`. **No son premolares** — los temporarios no tienen premolares, y es un error frecuente.
- [ ] Hay 32 piezas permanentes y 20 temporarias.
- [ ] `clave` nunca es un entero puro.
- [ ] Las filas temporarias arrancan en la **columna 4**: la 55 cae debajo de la 15, como en la ficha, no debajo de la 18.
- [ ] Los guards (`esClavePieza`, `esCodigoPieza`) rechazan `'toString'`, `'constructor'` y `'__proto__'`. Validar con `in` sobre un objeto común los da por válidos, porque recorre la cadena de prototipos — y estos guards existen para filtrar lo que baja de Firebase.
- [ ] El test de la degradación a array replica la regla real del SDK —todas las claves enteras y `maxKey < 2 × cantidad`— y verifica que con los códigos crudos da `true` y con las claves prefijadas da `false`. Un round-trip por `JSON` no sirve: devuelve un objeto en los dos casos.

**Por qué importa.** `ordenVisual` existe para que nadie ordene por código FDI ascendente: eso rompe en los cuadrantes 1 y 4, donde la numeración decrece de izquierda a derecha.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B1-1.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────


══════════════════════════════════════════════════════════════════════════════
ISSUE 2 DE 16  ·  B1-2  ·  Tipos del dominio
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B1-2 · Add odontogram domain types

**LABELS**

    /odontogram, feat

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   feat/odontograma-tipos
Toca:   src/lib/odontograma/tipos.ts (nuevo)
Depende: —
```

**Qué hace.** Declara los tipos que usan todos los demás: `Cara`, `Condicion`, `Alcance`, `HallazgoCara`, `HallazgoDiente`, `Vinculo`, `EventoOdontograma`, `OdontogramaActual`, `ClavePieza`.

`OdontogramaActual` se modela como `Record<ClavePieza, EstadoDiente>` — un mapa, nunca un array. Los servicios devuelven esa forma y la UI la consume tal cual.

Incluye `schemaVersion: 1` en `meta`.

**Criterios de aceptación**

- [ ] `ClavePieza` es un template literal type derivado de las constantes de B1-1, no un `string` suelto.
- [ ] Compila con `npm run build` sin errores de tipo.
- [ ] Ningún tipo del odontograma usa `any`.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B1-2.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────


══════════════════════════════════════════════════════════════════════════════
ISSUE 3 DE 16  ·  B1-3  ·  Catálogo de hallazgos
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B1-3 · Add findings catalog

**LABELS**

    /odontogram, feat

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   feat/odontograma-catalogo
Toca:   src/lib/odontograma/catalogo.ts (nuevo)
        src/__tests__/lib/odontograma/catalogo.test.ts (nuevo)
Depende: B1-2
```

**Qué hace.** La constante tipada con las 13 entradas de la tabla del contrato. Cada entrada declara `codigo`, `nombre`, `abrev`, `alcance`, `grafismo`, `capaPorDefecto` y `capasPermitidas`.

`grafismo` usa **los mismos valores que el `render` del prototipo** (`fill`, `cross`, `box`, `letter`, `screw`, `stump`, más `equals` y `span` que hay que agregar), para que el front consuma el catálogo sin tabla de traducción.

Expone `hallazgosPorAlcance(alcance)` para que el picker se arme filtrado: al clickear una cara solo se ofrecen los de cara, al clickear el diente los de pieza entera.

**Criterios de aceptación**

- [ ] Los códigos son únicos y coinciden con los `FindingType` del prototipo donde existen.
- [ ] Exactamente dos entradas tienen alcance `MULTI`, y son las dos prótesis.
- [ ] `hallazgosPorAlcance('CARA')` devuelve caries, obturación, sellante y fractura.
- [ ] `no_erupcionada` y `ausente` comparten grafismo `cross` — se distinguen por la capa, no por el dibujo.
- [ ] Agregar una entrada no requiere cambios fuera de este archivo y su grafismo.

**Nota.** El catálogo es el único lugar donde se decide qué hallazgos ofrece el sistema. Los servicios validan `tipo` contra él pero no lo conocen entrada por entrada: sumar o sacar hallazgos no toca la persistencia.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B1-3.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────


══════════════════════════════════════════════════════════════════════════════
ISSUE 4 DE 16  ·  B1-4  ·  Geometría de caras y derivación de color
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B1-4 · Resolve tooth faces per quadrant and derive layer color

**LABELS**

    /odontogram, feat

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   feat/odontograma-geometria-caras
Toca:   src/lib/odontograma/caras.ts (nuevo)
        src/__tests__/lib/odontograma/caras.test.ts (nuevo)
Depende: B1-2
```

**Qué hace.** Cuatro funciones puras. Trabajan con los mismos nombres de posición que el prototipo (`top`, `right`, `bottom`, `left`, `center`) para que no haya traducción de vocabulario.

- `caraSemantica(posicion, cuadrante)` → `Cara` — de lo que clickeó el usuario a lo que se guarda
- `posicionGeometrica(cara, cuadrante)` → `FacePosition` — la inversa, para pintar
- `etiquetaCara(cara, arcada, tipo)` → `"Palatino"` en las superiores y `"Lingual"` en las inferiores; `"Oclusal"` en molares y premolares, `"Incisal"` en incisivos y caninos
- `colorDe(capa)` → `ROJO | AZUL`

**Criterios de aceptación**

- [ ] En los cuadrantes **1 y 4**: `caraSemantica('left', q)` da `DISTAL` y `caraSemantica('right', q)` da `MESIAL`.
- [ ] En los cuadrantes **2 y 3**: `caraSemantica('left', q)` da `MESIAL` y `caraSemantica('right', q)` da `DISTAL`.
- [ ] `top` siempre es `VESTIBULAR`, `bottom` siempre `LINGUAL_PALATINO`, `center` siempre `OCLUSAL_INCISAL`.
- [ ] Ida y vuelta: `posicionGeometrica(caraSemantica(p, q), q) === p` para las 5 posiciones por los 8 cuadrantes.
- [ ] `colorDe('existente')` da rojo y `colorDe('requerida')` da azul — la convención de la ficha, **invertida respecto del prototipo actual**.
- [ ] Ningún otro archivo del proyecto decide un color de hallazgo.

**Por qué importa.** El prototipo mapea `left: 'Mesial'` para las 32 piezas y no tiene ninguna lógica de cuadrante. Si eso llega a la persistencia tal cual, el sistema guarda «caries en mesial» cuando la caries está en distal, en media boca, sin ningún error visible. Esta función es el único lugar donde se arregla.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B1-4.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────


══════════════════════════════════════════════════════════════════════════════
ISSUE 5 DE 16  ·  B1-5  ·  Selectores de vista
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B1-5 · Add view selectors for the odontogram state

**LABELS**

    /odontogram, feat

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   feat/odontograma-selectores
Toca:   src/lib/odontograma/selectores.ts (nuevo)
        src/__tests__/lib/odontograma/selectores.test.ts (nuevo)
Depende: B1-1, B1-2, B1-4
```

**Qué hace.** Las funciones puras que el componente necesita para preguntarle cosas al estado, sin meter lógica de dominio adentro del render.

```ts
filasDelArco(denticion): ClavePieza[][]        // 2 filas en permanente, 4 en mixta
hallazgoDeCara(estado, pieza, posicion, capa)  // resuelve la cara semántica por dentro
hallazgoDeDiente(estado, pieza, capa)
tieneHallazgos(estado, pieza): boolean          // para el estado vacío del diente
capasVisibles(estado, pieza, visibilidad)       // para el conmutador de capas
```

**Criterios de aceptación**

- [ ] `filasDelArco('PERMANENTE')` devuelve 2 filas de 16 en el orden del papel.
- [ ] `filasDelArco('MIXTA')` devuelve las 4 filas en el orden **1, 3, 4, 2**: en la ficha las temporarias van *entre* las permanentes, así que el número de fila no es el orden de render.
- [ ] `hallazgoDeCara(estado, 16, 'left', capa)` lee de `DISTAL`, y `hallazgoDeCara(estado, 26, 'left', capa)` lee de `MESIAL`. El componente pasa posiciones y nunca ve la cara semántica.
- [ ] Consultar una pieza sin hallazgos no rompe ni obliga a chequear `undefined` en el render.
- [ ] Ninguna de estas funciones toca Firebase ni React.

**Por qué existe.** Cuando el componente se reescriba con nuestros estándares, va a necesitar estas preguntas igual. Que vivan acá —puras y testeadas— en vez de inline en el JSX es lo que evita que la traducción cuadrante ↔ cara se filtre en el render y se rompa la próxima vez que alguien toque el componente.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B1-5.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────


══════════════════════════════════════════════════════════════════════════════
ISSUE 6 DE 16  ·  B2-1  ·  Estructura del nodo y Security Rules
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B2-1 · Define odontogram node and append-only security rules

**LABELS**

    /odontogram, feat

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   feat/odontograma-reglas-firebase
Toca:   database.rules.json (o la consola de Firebase)
        AGENTS.md
Depende: —
```

**Qué hace.** Declara el árbol del contrato de datos y las reglas que hacen cumplir la inmutabilidad del log.

```json
"eventos": {
  "$evt": {
    ".write": "!data.exists()",
    ".validate": "newData.hasChildren(['ts','uid','alcance','diente'])"
  }
}
```

**Criterios de aceptación**

- [ ] Un cliente autenticado puede **crear** un evento.
- [ ] Un cliente autenticado **no** puede editar ni borrar un evento existente. Probado a mano contra la base de desarrollo.
- [ ] `actual/` sigue siendo escribible normalmente.
- [ ] El acceso está scopeado por `clinicId` como el resto del árbol.

**Por qué importa.** Todo el código de este proyecto corre en el browser. Una garantía de inmutabilidad que viva en el cliente es decorativa: la única que cuenta es la de las reglas.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B2-1.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────


══════════════════════════════════════════════════════════════════════════════
ISSUE 7 DE 16  ·  B2-2  ·  Lectura del odontograma
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B2-2 · Read the odontogram from Realtime Database

**LABELS**

    /odontogram, feat

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   feat/odontograma-lectura
Toca:   src/services/odontograma/getOdontograma.ts (nuevo)
        src/__tests__/services/odontograma/getOdontograma.test.ts (nuevo)
Depende: B1-1, B1-2, B1-5, B2-1
```

**Qué hace.** `getOdontograma(pacienteId, clinicId)` devuelve `{ dientes, vinculos, meta }` con `dientes` normalizado como `Record<ClavePieza, EstadoDiente>`. La pantalla lo pasa por `aFront()` del adaptador antes de dárselo al componente.

**Criterios de aceptación**

- [ ] Un paciente sin odontograma devuelve `{ dientes: {}, vinculos: {}, meta: null }`, **no** `null`. La pantalla tiene que poder dibujar la boca sana sin ramas especiales.
- [ ] Test de regresión del array: un nodo con 32 dientes cargados devuelve un objeto, no un array con huecos.
- [ ] Sigue el patrón de `navigator.onLine` de los services existentes.
- [ ] `vinculos` se devuelve como mapa por `pushId`.
- [ ] Una cara con las dos capas cargadas se devuelve con las dos.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B2-2.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────


══════════════════════════════════════════════════════════════════════════════
ISSUE 8 DE 16  ·  B2-3  ·  Escritura de hallazgos
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B2-3 · Write findings with atomic multi-path update and audit event

**LABELS**

    /odontogram, feat

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   feat/odontograma-escritura-hallazgos
Toca:   src/services/odontograma/setHallazgo.ts (nuevo)
        src/services/odontograma/removeHallazgo.ts (nuevo)
        src/__tests__/services/odontograma/setHallazgo.test.ts (nuevo)
Depende: B2-1, B2-2
```

**Qué hace.** `setHallazgoCara`, `setHallazgoDiente` y `removeHallazgo`. Cada una recibe la **capa** además del hallazgo, y escribe una sola hoja: `caras/{CARA}/{capa}` o `diente/{capa}`. Poner algo en la capa `requerida` no toca lo que haya en `existente`.

Estado y asiento de auditoría van en un solo `update()` multi-path, de forma atómica.

```ts
const eventoKey = push(child(ref(db), `${base}/eventos`)).key;
await update(ref(db), {
  [`${base}/actual/dientes/t16/caras/OCLUSAL_INCISAL/requerida`]: 'caries',
  [`${base}/actual/meta/updatedAt`]: serverTimestamp(),
  [`${base}/actual/meta/updatedBy`]: uid,
  [`${base}/eventos/${eventoKey}`]: evento,
});
```

**Criterios de aceptación**

- [ ] El `update()` lleva siempre las tres rutas: estado, `meta` y evento.
- [ ] Escribir en una capa **no borra ni modifica la otra** sobre la misma cara o el mismo diente.
- [ ] Se usa `serverTimestamp()`, nunca `Date.now()`.
- [ ] `removeHallazgo` no borra el evento anterior: escribe `null` en la hoja y agrega un evento nuevo con `a: null`.
- [ ] El evento guarda `capa`, `de` y `a` para poder reconstruir la transición.
- [ ] Cuando una prestación requerida se ejecuta, la operación es: `null` en `requerida` + el hallazgo en `existente`, en **un solo** `update()`, con un evento que lo registre.

**Por qué `serverTimestamp()`.** El reloj del cliente no es confiable, y esto es una historia clínica: la fecha de cada asiento tiene consecuencias legales.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B2-3.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────


══════════════════════════════════════════════════════════════════════════════
ISSUE 9 DE 16  ·  B2-4  ·  Vínculos multi-pieza
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B2-4 · Add multi-tooth links for fixed and removable prosthetics

**LABELS**

    /odontogram, feat

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   feat/odontograma-vinculos
Toca:   src/services/odontograma/setVinculo.ts (nuevo)
        src/services/odontograma/removeVinculo.ts (nuevo)
        src/__tests__/services/odontograma/setVinculo.test.ts (nuevo)
Depende: B1-3, B2-3
```

**Qué hace.** Alta y baja de prótesis fija y removible, que abarcan varias piezas. El id lo genera `push()`.

**Criterios de aceptación**

- [ ] Un vínculo requiere **al menos 2 piezas**.
- [ ] Todas las piezas de un vínculo son de la **misma arcada**. Un puente no cruza de arriba abajo.
- [ ] Las piezas son **contiguas** según `ordenVisual` — un puente no salta piezas sueltas.
- [ ] Rechazar un vínculo inválido devuelve un error legible, no revienta.
- [ ] Alta y baja generan su evento, igual que los hallazgos.

**Nota.** Esto estaba planificado para una fase posterior. La ficha en papel lo tiene en la lista principal, así que va en la v1.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B2-4.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────


══════════════════════════════════════════════════════════════════════════════
ISSUE 10 DE 16  ·  B2-5  ·  Lectura del historial
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B2-5 · Read the odontogram event history

**LABELS**

    /odontogram, feat

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   feat/odontograma-eventos
Toca:   src/services/odontograma/getEventos.ts (nuevo)
Depende: B2-1
```

**Qué hace.** `getEventos(pacienteId, clinicId, limite)` con `orderByKey()` y `limitToLast()`, devuelto en orden cronológico **inverso** para que la UI lo liste sin invertirlo.

**Criterios de aceptación**

- [ ] Las push IDs dan el orden cronológico sin necesidad de índice extra.
- [ ] El límite por defecto es acotado (50) — el historial de un paciente viejo puede ser largo.
- [ ] No se lee `eventos` desde la misma llamada que `actual`: son nodos hermanos justo para que abrir la pantalla no baje el historial entero.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B2-5.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────


══════════════════════════════════════════════════════════════════════════════
ISSUE 11 DE 16  ·  B3-1  ·  Seed de odontogramas en /dev
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B3-1 · Add odontogram seed button in `/dev`

**LABELS**

    /odontogram, chore

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   feat/odontograma-seed-dev
Toca:   src/dev/seedOdontograma.ts (nuevo)
        src/app/dev/page.tsx
Depende: B2-3, B2-4
```

**Qué hace.** Botón temporal en `/dev` que carga un odontograma de ejemplo sobre un paciente existente, siguiendo el patrón de `src/dev/migrateAddTimestamps.ts` — ejecutado con sesión de browser activa, nunca un script externo.

El ejemplo tiene que ejercitar todos los casos: caries en varias caras, obturaciones, una pieza ausente, una extracción pendiente, una corona y un puente de tres piezas.

**Criterios de aceptación**

- [ ] Permite probar la UI sin cargar nada a mano.
- [ ] Es idempotente: correrlo dos veces no duplica vínculos.
- [ ] Genera los eventos correspondientes, así que también sirve para probar el historial.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B3-1.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────


══════════════════════════════════════════════════════════════════════════════
ISSUE 12 DE 16  ·  B3-2  ·  Tests de los servicios
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B3-2 · Cover odontogram services with tests

**LABELS**

    /odontogram, chore

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   feat/odontograma-tests-servicios
Toca:   src/__tests__/services/odontograma/*
Depende: B2-5
```

**Qué hace.** Completa la cobertura de los services con el mock de `firebase/database` que ya usan los tests de `appointments` y `patients`.

**Criterios de aceptación**

- [ ] `npm run test:run` pasa.
- [ ] `npm run build` pasa.
- [ ] Cubiertos: lectura vacía, lectura con 32 dientes, escritura multi-path, borrado que no borra el evento, vínculo inválido.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B3-2.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────


══════════════════════════════════════════════════════════════════════════════
ISSUE 13 DE 16  ·  B3-3  ·  Actualizar AGENTS.md
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B3-3 · Document the odontogram module in AGENTS.md

**LABELS**

    /odontogram, docs

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   docs/odontograma-contexto
Toca:   AGENTS.md
Depende: B3-2
```

**Qué hace.** El Paso 6 de la metodología: si la tarea agregó un patrón, una decisión de arquitectura o un nodo de Firebase nuevo, se documenta **antes** del commit.

**Criterios de aceptación**

- [ ] El nodo `odontogramas/` está en el árbol de datos.
- [ ] Está anotada la convención de claves con prefijo `t` y **por qué** existe.
- [ ] Está anotada la convención de colores de la clínica, con la aclaración de que está invertida respecto de la norma MINSA.
- [ ] Está anotada la carpeta `src/lib/odontograma/` como el lugar del dominio puro.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B3-3.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────


══════════════════════════════════════════════════════════════════════════════
ISSUE 14 DE 16  ·  B4-1  ·  Reglas de dentición
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B4-1 · Enforce dentition rules for primary teeth

**LABELS**

    /odontogram, feat

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   feat/odontograma-denticion-temporaria
Toca:   src/lib/odontograma/catalogo.ts
        src/services/odontograma/setVinculo.ts
        sus tests
Depende: B2-4
```

**Qué hace.** Declara qué aplica a qué dentición y lo hace cumplir donde importa.

No todos los hallazgos tienen sentido en un diente de leche: un **implante** no va sobre una pieza temporaria, y una **prótesis fija** tampoco. El catálogo gana un campo `denticiones` y los servicios lo validan.

**Criterios de aceptación**

- [ ] Cada entrada del catálogo declara a qué denticiones aplica.
- [ ] Intentar poner `implante` sobre una pieza temporaria devuelve un error legible.
- [ ] Un vínculo no puede mezclar piezas permanentes y temporarias.
- [ ] Los hallazgos de cara (caries, obturación, sellante) aplican a las dos denticiones sin restricción.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B4-1.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────


══════════════════════════════════════════════════════════════════════════════
ISSUE 15 DE 16  ·  B4-2  ·  Exfoliación y erupción
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B4-2 · Treat exfoliation and eruption as two separate teeth

**LABELS**

    /odontogram, docs

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   feat/odontograma-recambio-dentario
Toca:   src/services/odontograma/ (tests)
        docs
Depende: B4-1
```

**Qué hace.** Nada de código nuevo, y por eso conviene tenerlo escrito: cuando se cae la 55 y erupciona la 15, son **dos hallazgos sobre dos piezas distintas**, no una edición de la misma. La 55 pasa a `ausente` y la 15 deja de estar `no_erupcionada`.

El modelo ya lo soporta —son posiciones independientes— pero el histórico tiene que reflejarlo como dos eventos, y eso hay que testearlo antes de que alguien intente «convertir» un diente en otro.

**Criterios de aceptación**

- [ ] Un test que simula el recambio de una pieza y verifica que quedan dos eventos, uno por pieza.
- [ ] La 55 ausente y la 15 presente conviven en el mismo odontograma sin conflicto.
- [ ] Está documentado en `AGENTS.md` que las piezas temporarias y sus sucesoras son entidades separadas.

**Por qué importa.** Es la tentación obvia: «la 55 se transforma en la 15». Si alguien lo implementa así, se pierde la historia del diente de leche y el registro deja de ser una historia clínica.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B4-2.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────


══════════════════════════════════════════════════════════════════════════════
ISSUE 16 DE 16  ·  B4-3  ·  Seed de paciente pediátrico
══════════════════════════════════════════════════════════════════════════════

**TÍTULO**

    B4-3 · Add mixed-dentition seed for a pediatric patient

**LABELS**

    /odontogram, chore

**BODY**

──────────────────────────────────────────────────────────────────────────────
```
Rama:   feat/odontograma-seed-pediatrico
Toca:   src/dev/seedOdontograma.ts
        src/app/dev/page.tsx
Depende: B4-1
```

**Qué hace.** Un segundo botón en `/dev` que carga un odontograma de dentición mixta: temporarias con caries y obturaciones, alguna exfoliada, y permanentes erupcionando.

**Criterios de aceptación**

- [ ] Ejercita las cuatro filas de la ficha.
- [ ] Incluye al menos un recambio en curso: temporaria ausente con su sucesora presente.
- [ ] Es idempotente, igual que el seed de adultos.

---

### Cómo se implementa

El contrato completo vive en el repo y el agente lo lee. Copiale esto y nada más:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B4-3.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

Después: rama primero, `npm run build` y `npm run test:run` antes de dar por terminado, y si la tarea agregó un patrón o una carpeta nueva, actualizar `AGENTS.md` **antes** del commit.
──────────────────────────────────────────────────────────────────────────────
