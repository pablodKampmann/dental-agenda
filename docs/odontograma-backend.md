# Odontograma — Backend: iteraciones e issues

> Planificación del trabajo de backend. **16 issues en 4 iteraciones** — las tres primeras son la versión de adultos, la cuarta es la de niños.
> Fuente de verdad del dominio: **la ficha en papel de la odontóloga** (foto del 25/08/2026).
> El prototipo de front (`dental-agenda-main/project`) es **referencia**: tomamos sus componentes y los reescribimos con los estándares de la web.

---

## Cómo trabaja el equipo con esto

**Las issues se cargan a mano en GitLab.** `docs/issues-para-pegar.md` tiene los 16 bloques ya armados: título en inglés, labels y body. Las labels siguen la convención del tablero: scope `/odontogram` más el tipo (`feat`, `chore` o `docs`), y `Sprint #N` al planificar. La iteración no lleva label — ya está en el prefijo del título (`B1-1 ·`).

Los criterios de aceptación van como `- [ ]` a propósito: GitLab los renderiza como task list con contador de progreso, así que no hay que convertirlos a viñetas al pegar.

**Cada issue trae adentro cómo se implementa.** Al final del body está el prompt exacto para el agente. El que agarra la issue copia ese bloque y no tiene que acordarse del procedimiento ni preguntarle a nadie:

```
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue B1-1.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
```

**Una rama por issue, y se mergea a `dev` antes de arrancar la siguiente.** Muchas issues declaran `Depende`, así que la tentación es sacar cada rama de la anterior y encadenarlas. No lo hagan: con tres ramas apiladas el PR de la última muestra los commits de las tres, y un comentario de review sobre la primera obliga a rebasear toda la cadena. Si la issue que sigue necesita código de la anterior, ese es el momento de mergear la anterior, no de apilar.

**Por qué el prompt es tan corto.** El Paso 4 de la metodología pide contexto de negocio, no instrucciones técnicas: el agente decide la implementación. Pegarle el issue entero sería dictarle la solución; resumírselo perdería los criterios de aceptación. La salida es que el contrato viva en el repo y el prompt apunte a él. Con `AGENTS.md` y este documento, el agente tiene todo.

La última línea —«decime si algo te resulta ambiguo»— es la que evita que invente cuando el documento no alcanza. Si la usa, esa ambigüedad es un cambio a este documento, no una decisión del agente.

---

## Lo que cambió con la ficha en papel

Tres cosas, y las tres tocan el modelo:

1. **Los colores están invertidos** respecto de la norma MINSA. La ficha dice: *"COLOR ROJO: Prestaciones existentes / COLOR AZUL: Prestaciones requeridas"*. Rojo es lo que el paciente **ya tiene**; azul es lo que **hay que hacerle**.
2. **El catálogo real son 6 símbolos**, no 39 ni 10: pieza no erupcionada, extracción, pieza ausente, prótesis fija, prótesis removible, coronas. Más el relleno de caras, cuyo color indica la condición.
3. **Dos de esos seis son multi-pieza** (prótesis fija y removible) y están en el uso diario. El nodo `vinculos` y la selección de varias piezas entran en la v1, no en una fase posterior.

La ficha también trae la **dentición temporaria** en dos filas internas. La decisión del equipo fue arrancar por permanente y se mantiene, pero las constantes generan las 52 posiciones desde la primera issue para que encenderla sea un cambio de render.

---

## Qué tomamos del prototipo

El prototipo (`dental-agenda-main/project`) es **referencia, no dependencia**. No adaptamos el back a su forma: tomamos sus componentes y su resolución visual, y los reescribimos con los estándares de la web —`useAuth()`, `useToast`, alias `@/`, tokens de `tailwind.config`, componentes de `shared/ui`—. El backend define su propio modelo y el componente portado lo consume directo.

### Lo que sí tomamos

- **La geometría del diente**: el cuadrado con las diagonales, cinco polígonos clickeables, y las posiciones `top / right / bottom / left / center`. Está bien resuelta y no hay razón para reinventarla.
- **El modelo de dos capas.** Esto es lo más valioso que aportó y **corrigió el contrato**: en el prototipo una cara puede tener hallazgo existente **y** requerido a la vez. Se ve en el estado de demo:

```ts
update(25, { tooth: { existente: 'corona', planificado: 'endodoncia' } });
update(24, { faces: { left: { existente: 'caries' }, center: { planificado: 'caries' } } });
```

  Una pieza puede tener una corona puesta **y** una endodoncia pendiente. El árbol de datos quedó corregido para soportarlo: cada cara y cada diente llevan un hallazgo por capa.

- **La interacción del picker**: click en cara o en diente, popover con el catálogo filtrado por alcance, selector de capa.
- **Los nueve hallazgos de su catálogo**, que se unen a los de la ficha.

### Lo que no tomamos

| | Prototipo | Nuestra versión |
|---|---|---|
| Estado | `Record<number, ToothState>` | `Record<ClavePieza, EstadoDiente>` con claves `t16` |
| Caras | `left: 'Mesial'` fijo para las 32 piezas | Cara semántica resuelta por cuadrante |
| Capas | `existente` / `planificado` | `existente` / `requerida`, como dice la ficha |
| Colores | existente azul, planificado rojo | **existente rojo, requerida azul** |
| Estilo | Tailwind suelto, paleta slate | Tokens del proyecto, `teal-600`, `border-gray-300`, `rounded-xl` |

### Dos cosas para tener a mano al portar

**El color está al revés.** `LAYER_COLORS` tiene `existente: '#2563eb'` (azul) y `planificado: '#dc2626'` (rojo). La ficha de la odontóloga dice lo contrario. El prototipo salió con la convención MINSA, que es la que aparece si preguntás en general — pero acá manda el papel. Si se porta tal cual, la pantalla dice lo opuesto a lo que ella viene anotando hace años.

**`FACE_LABELS` está mal para media boca.** Mapea `left: 'Mesial'` y `right: 'Distal'` para las 32 piezas, y `Tooth.tsx` no tiene ninguna lógica de cuadrante — no aparece la palabra en todo el archivo. En los cuadrantes 1 y 4 la cara izquierda es **distal**. Visualmente no se nota; clínicamente es un dato falso. La función de B1-4 es la que lo resuelve, y el componente portado la tiene que usar tanto para guardar como para etiquetar el popover.

### Lo que el prototipo no tiene

Prótesis fija y removible no existen ahí, y están en el uso diario de la ficha. Necesitan selección de varias piezas y un grafismo que abarque el tramo. El backend las soporta desde B2-4.

---

## Contrato de datos

Las issues lo referencian en vez de repetirlo.

### Árbol

```
/clinics/{clinicId}/odontogramas/{pacienteId}/

  actual/
    meta/     { updatedAt, updatedBy, schemaVersion: 1 }
    dientes/
      t16/
        caras/                          # una entrada por cara CON hallazgo
          OCLUSAL_INCISAL/ { existente: "obturacion", requerida: "caries" }
          MESIAL/          { requerida: "caries" }
        diente/            { existente: "corona", requerida: "endodoncia" }
    vinculos/
      {pushId}: { tipo: "protesis_fija", capa: "existente",
                  piezas: { t45: true, t46: true, t47: true } }

  eventos/                              # append-only
    {pushId}: { ts, uid, alcance: "CARA"|"DIENTE"|"MULTI", capa: "existente"|"requerida",
                diente: "t16"|null,               # null cuando el alcance es MULTI
                piezas: { t45: true, … }|null,    # solo cuando el alcance es MULTI
                cara: "OCLUSAL_INCISAL"|null,     # solo cuando el alcance es CARA
                de: "obturacion"|null, a: "caries"|null }
```

**Cada cara y cada diente llevan un hallazgo por capa**, no uno solo. `caras/{CARA}/{capa}` y `diente/{capa}` son hojas con el código del hallazgo. Escribir es poner una hoja; borrar es poner `null` en esa hoja. Es la forma más simple que soporta lo que el prototipo ya hace.

**Claves con prefijo `t`.** Si son enteras (`"16"`, `"46"`) el SDK convierte el objeto en un array de JavaScript al leerlo, y la forma del dato cambia según cuántos dientes haya cargados. No es opcional.

**Solo se persiste lo anómalo.** Un diente sin hallazgos no existe en el árbol.

**En Realtime Database `null` es ausencia de clave, no un valor.** Escribir `diente: null` no guarda un nulo: no guarda nada. Al leer, el SDK devuelve `undefined`, no `null`. Los tipos que modelan el evento pueden decir `null` del lado del dominio, pero la lectura de B2-5 tiene que normalizar, y las reglas de B2-1 no pueden exigir una clave que a veces no existe.

**Un evento `MULTI` guarda el tramo entero en `piezas`, no una pieza suelta en `diente`.** Un puente abarca varias piezas y el log tiene que poder reconstruir cuáles: elegir una arbitraria haría que el asiento no represente lo que pasó. Por eso `diente` es nulable y aparece `piezas` — se llena uno o el otro, según el alcance.

**`CodigoPieza` y `ClavePieza` ya existen** en `src/lib/odontograma/piezas.ts` (B1-1, commit `02e59e5`), como uniones de literales derivadas de la tabla. Se re-exportan, no se redeclaran: dos tipos que parecen iguales y no lo son es peor que uno solo.

### Tipos

```ts
type Cara = 'MESIAL' | 'DISTAL' | 'VESTIBULAR' | 'LINGUAL_PALATINO' | 'OCLUSAL_INCISAL'
type Capa = 'existente' | 'requerida'          // el prototipo las llama layers
type Alcance = 'CARA' | 'DIENTE' | 'MULTI'
type ClavePieza = `t${CodigoPieza}`             // unión de los 52 literales, no `t${number}`

// posiciones geométricas — las mismas que usa el prototipo
type FacePosition = 'top' | 'right' | 'bottom' | 'left' | 'center'

colorDe(capa) = capa === 'existente' ? ROJO : AZUL
```

### Catálogo v1

Unión de los nueve del prototipo con los que faltaban de la ficha. `grafismo` usa los mismos valores que el `render` del prototipo, para que no haya tabla de traducción.

| Código | Nombre | `abrev` | Alcance | Grafismo | Capa por defecto | De dónde sale |
|---|---|---|---|---|---|---|
| `caries` | Caries | `C` | CARA | `fill` | requerida | ambos |
| `obturacion` | Obturación | `O` | CARA | `fill` | existente | ambos |
| `sellante` | Sellante | `S` | CARA | `fill` | existente | prototipo |
| `fractura` | Fractura | `F` | CARA | `fill` | existente | prototipo |
| `ausente` | Pieza ausente | `X` | DIENTE | `cross` | existente | ambos |
| `corona` | Corona | `Co` | DIENTE | `box` | existente | ambos |
| `endodoncia` | Endodoncia | `E` | DIENTE | `letter` | existente | prototipo |
| `implante` | Implante | `I` | DIENTE | `screw` | existente | prototipo |
| `remanente` | Remanente radicular | `RR` | DIENTE | `stump` | existente | prototipo |
| `extraccion` | Extracción | `Ex` | DIENTE | `equals` ⚠️ | requerida | ficha |
| `no_erupcionada` | Pieza no erupcionada | `NE` | DIENTE | `cross` | requerida | ficha |
| `protesis_fija` | Prótesis fija | `PF` | MULTI | `span` ⚠️ | existente | ficha |
| `protesis_removible` | Prótesis removible | `PR` | MULTI | `span` ⚠️ | existente | ficha |

**Las primeras nueve `abrev` salen del prototipo**, de `data/findings.ts`, y se copian tal cual: adoptamos su catálogo, así que sus abreviaturas ya estaban decididas. Las cuatro últimas no existen ahí y las completo con la costumbre de siglas de la propia ficha.

`abrev` **no se persiste** — es presentación, la usa el grafismo `letter` y las etiquetas del picker. Si la odontóloga tiene sus propias siglas, se cambian después sin tocar un solo dato guardado.

**Las 13 aceptan las dos capas.** `capaPorDefecto` solo preselecciona en el picker; el selector de capa queda siempre habilitado. Es lo que hace el prototipo —endodoncia tiene default existente y en su demo aparece como planificada— y evita bloquear a la odontóloga por una regla clínica que nadie le preguntó. Por eso el catálogo **no lleva `capasPermitidas`**: si todas aceptan las dos, el campo es redundante con «siempre ambas». Cuando aparezca un hallazgo que de verdad necesite restricción, se agrega ahí.

⚠️ Los tres grafismos marcados **no existen todavía en el prototipo** y hay que dibujarlos: `equals` es el signo `=` de la ficha, y `span` es el rectángulo que abarca el tramo de piezas de una prótesis.

`no_erupcionada` reusa `cross`, igual que `ausente`: en la ficha las dos son un aspa y se distinguen solo por el color. El componente ya lo soporta, porque el color sale de la capa.

---

## Iteración B1 — Dominio puro

Sin Firebase y sin UI. Todo lo de acá es determinístico y testeable sin mocks. Es la iteración que hay que hacer bien: los tres bugs clásicos del odontograma se previenen o se cometen acá.

---

### B1-1 · Constantes de las piezas FDI

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

### B1-2 · Tipos del dominio

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

### B1-3 · Catálogo de hallazgos

```
Rama:   feat/odontograma-catalogo
Toca:   src/lib/odontograma/catalogo.ts (nuevo)
        src/__tests__/lib/odontograma/catalogo.test.ts (nuevo)
Depende: B1-2
```

**Qué hace.** La constante tipada con las 13 entradas de la tabla del contrato. Cada entrada declara `codigo`, `nombre`, `abrev`, `alcance`, `grafismo` y `capaPorDefecto`.

`grafismo` usa **los mismos valores que el `render` del prototipo** (`fill`, `cross`, `box`, `letter`, `screw`, `stump`, más `equals` y `span` que hay que agregar), para que el front consuma el catálogo sin tabla de traducción.

Expone `hallazgosPorAlcance(alcance)` para que el picker se arme filtrado: al clickear una cara solo se ofrecen los de cara, al clickear el diente los de pieza entera.

**Criterios de aceptación**

- [ ] Los códigos son únicos y coinciden con los `FindingType` del prototipo donde existen.
- [ ] Exactamente dos entradas tienen alcance `MULTI`, y son las dos prótesis.
- [ ] `hallazgosPorAlcance('CARA')` devuelve caries, obturación, sellante y fractura.
- [ ] `no_erupcionada` y `ausente` comparten grafismo `cross` — se distinguen por la capa, no por el dibujo.
- [ ] Agregar una entrada toca **exactamente dos archivos** —el catálogo y la unión de códigos de `tipos.ts`— más su grafismo. La persistencia y los servicios no se tocan.
- [ ] El desajuste entre los dos es un **error de build**, no un hallazgo que aparece en el picker y después no se puede guardar. La unión de códigos vive en `tipos.ts` a propósito: es vocabulario persistido, y `catalogo.ts` ya depende de ahí — derivarla al revés invertiría la dependencia.
- [ ] Hay un test de aserciones de tipo que tipa el árbol de ejemplo del contrato contra `EstadoDiente`, `Vinculo` y `EventoOdontograma`. Hasta acá nada verifica que los tipos de B1-2 encajen con el árbol documentado — el build solo comprueba que las declaraciones sean válidas.

**Nota.** El catálogo es el único lugar donde se decide qué hallazgos ofrece el sistema. Los servicios validan `tipo` contra él pero no lo conocen entrada por entrada: sumar o sacar hallazgos no toca la persistencia.

---

### B1-4 · Geometría de caras y derivación de color

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

### B1-5 · Selectores de vista

```
Rama:   feat/odontograma-selectores
Toca:   src/lib/odontograma/selectores.ts (nuevo)
        src/__tests__/lib/odontograma/selectores.test.ts (nuevo)
Depende: B1-1, B1-2, B1-4
```

**Qué hace.** Las funciones puras que el componente necesita para preguntarle cosas al estado, sin meter lógica de dominio adentro del render.

```ts
filasDelArco(vista: VistaArcada): ClavePieza[][]  // 'PERMANENTE' → 2 filas, 'MIXTA' → 4
hallazgoDeCara(estado, pieza, posicion, capa)  // resuelve la cara semántica por dentro
hallazgoDeDiente(estado, pieza, capa)
tieneHallazgos(estado, pieza): boolean          // para el estado vacío del diente
capasVisibles(estado, pieza, visibilidad)       // para el conmutador de capas
```

**Criterios de aceptación**

- [ ] `VistaArcada` es un tipo propio (`'PERMANENTE' | 'MIXTA'`), **no** `Denticion`: mixta no es una dentición, es un modo de vista. `Denticion` en `piezas.ts` sigue siendo `'PERMANENTE' | 'TEMPORARIA'` y describe a la pieza, no a la pantalla.
- [ ] `filasDelArco('PERMANENTE')` devuelve 2 filas de 16 en el orden del papel.
- [ ] `filasDelArco('MIXTA')` devuelve las 4 filas en el orden **1, 3, 4, 2**: en la ficha las temporarias van *entre* las permanentes, así que el número de fila no es el orden de render.
- [ ] `hallazgoDeCara(estado, 16, 'left', capa)` lee de `DISTAL`, y `hallazgoDeCara(estado, 26, 'left', capa)` lee de `MESIAL`. El componente pasa posiciones y nunca ve la cara semántica.
- [ ] Consultar una pieza sin hallazgos no rompe ni obliga a chequear `undefined` en el render.
- [ ] Ninguna de estas funciones toca Firebase ni React.

**Por qué existe.** Cuando el componente se reescriba con nuestros estándares, va a necesitar estas preguntas igual. Que vivan acá —puras y testeadas— en vez de inline en el JSX es lo que evita que la traducción cuadrante ↔ cara se filtre en el render y se rompa la próxima vez que alguien toque el componente.

---

## Iteración B2 — Persistencia

Recién acá aparece Firebase. Todo sigue el patrón de `src/services/{feature}/`: SDK directo, `navigator.onLine`, sin API propia.

---

### B2-1 · Estructura del nodo y Security Rules

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
    ".validate": "newData.hasChildren(['ts','uid','alcance','capa'])
                   && (newData.hasChild('diente') || newData.hasChild('piezas'))"
  }
}
```

**Criterios de aceptación**

- [ ] Un cliente autenticado puede **crear** un evento.
- [ ] Un cliente autenticado **no** puede editar ni borrar un evento existente. Probado a mano contra la base de desarrollo.
- [ ] Un evento `MULTI` —que escribe `piezas` y no `diente`— **entra**. La regla no puede exigir `diente`: en Realtime Database `null` es ausencia de clave, así que pedirlo rechazaría todo evento de prótesis.
- [ ] Un evento sin `diente` **ni** `piezas` se rechaza.
- [ ] `actual/` sigue siendo escribible normalmente.
- [ ] El acceso está scopeado por `clinicId` como el resto del árbol.

**Por qué importa.** Todo el código de este proyecto corre en el browser. Una garantía de inmutabilidad que viva en el cliente es decorativa: la única que cuenta es la de las reglas.

---

### B2-2 · Lectura del odontograma

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

### B2-3 · Escritura de hallazgos

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

### B2-4 · Vínculos multi-pieza

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
- [ ] Alta y baja generan su evento con **el tramo completo en `piezas`**, no una pieza suelta en `diente`. El log tiene que poder reconstruir qué piezas abarcaba el puente.

**Nota.** Esto estaba planificado para una fase posterior. La ficha en papel lo tiene en la lista principal, así que va en la v1.

---

### B2-5 · Lectura del historial

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

## Iteración B3 — Soporte y cierre

---

### B3-1 · Seed de odontogramas en /dev

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

### B3-2 · Tests de los servicios

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

### B3-3 · Actualizar AGENTS.md

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

## Iteración B4 — Dentición temporaria

Va **después** de que la versión de adultos esté andando. Y acá está la buena noticia: **si B1-1 se hace bien, el backend para niños es casi gratis.**

Las constantes ya generan las 52 posiciones desde la primera issue. Las claves `t51`…`t85` funcionan igual que las permanentes, el árbol no cambia, los servicios no cambian, las reglas no cambian. El grueso del trabajo de la dentición temporaria es de **front**: dos filas internas más, que es exactamente como está dibujada la ficha en papel.

Lo que sí necesita backend son tres cosas.

---

### B4-1 · Reglas de dentición

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

### B4-2 · Exfoliación y erupción

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

### B4-3 · Seed de paciente pediátrico

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

## Orden y dependencias

```
B1-1 ──┬──────────────┐
B1-2 ──┼──► B1-3 ──┐  │
       └──► B1-4 ──┼──┴──► B1-5 ──► B2-2 ──► B2-3 ──► B2-4 ──┬──► B3-1 ──► B3-2 ──► B3-3
                   │                                          │
B2-1 ──────────────┴──► B2-5 ─────────────────────────────────┘

                  … con adultos andando …

B2-4 ──► B4-1 ──┬──► B4-2
                └──► B4-3
```

**Sin dependencias, se pueden repartir el día uno:** B1-1, B1-2 y B2-1.

De B2-2 en adelante es una cadena. B4 arranca recién cuando la versión de adultos está funcionando, y es corta justamente porque B1-1 generó las 52 posiciones desde el principio.

B1-4 y B1-5 conviene que las haga la misma persona: entre las dos se juega la corrección clínica del módulo, y comparten la misma cabeza.

---

## Preguntas que siguen abiertas

Ninguna bloquea la Iteración B1.

**¿Quién firma cada asiento?** La ley pide identificar al profesional interviniente y su matrícula. Los turnos hoy no guardan el odontólogo, aunque existe `/professionals`. Mientras tanto los eventos guardan `uid` del usuario logueado, que es lo único disponible. Si la respuesta cambia, es un campo más en el evento — no rompe lo ya guardado.

**¿El odontograma alimenta el presupuesto?** Un hallazgo con condición `REQUERIDA` es conceptualmente una línea de presupuesto, y aranceles ya tiene los capítulos con precios. Si la respuesta es sí, conviene agregarle al catálogo un campo que apunte a la práctica del tarifario, aunque no se use todavía. Es barato ahora y caro después.

**¿Temporaria cuándo?** La ficha en papel la tiene. Las constantes ya la generan. Es una decisión de cuándo encenderla en el render, no de backend.
