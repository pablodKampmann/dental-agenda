# Odontograma — planificación del front

> Complemento de `docs/odontograma-backend.md`. Ese documento define el contrato de datos y
> los servicios; este define la pantalla. Las issues de acá **no arrancan hasta que B3 esté
> cerrado**: F4 consume los servicios de B2 y no tiene sentido escribirlas contra mocks.
>
> Los pendientes que eran input de esta planificación vivían en
> `docs/odontograma-pendientes.md` §3; F4-4 la vació resolviendo o descartando cada uno.
> Lo que sobrevive como regla está en `AGENTS.md`.

## Dónde se monta

La pestaña **Odontograma** de la ficha del paciente, que ya existe. El ancho útil es el del
contenedor de la ficha, no el de la ventana: el arco tiene que caber ahí sin scroll
horizontal en la resolución de escritorio de la clínica.

## Lo que ya está resuelto y no se rehace

La capa de dominio (B1) existe y es la que manda. El componente **no** decide nada de esto:

| Pregunta | Quién la responde |
|---|---|
| Qué piezas hay y en qué orden | `piezas.ts` → `PIEZAS`, `piezasDeFila` |
| Qué filas se dibujan | `selectores.ts` → `filasDelArco(vista)` |
| Qué cara es la zona que clickeé | `caras.ts` → `caraSemantica(posicion, cuadrante)` |
| Dónde pinto una cara guardada | `caras.ts` → `posicionGeometrica(cara, cuadrante)` |
| Cómo se llama esa cara | `caras.ts` → `etiquetaCara(cara, arcada, tipo)` |
| De qué color va | `caras.ts` → `colorDe(capa)` |
| Qué hallazgos existen y su grafismo | `catalogo.ts` → `HALLAZGOS`, `hallazgosPorAlcance()` |
| Qué tiene cargado esta pieza | `selectores.ts` → `hallazgoDeCara`, `hallazgoDeDiente`, `capasVisibles` |

**El tipo `Cara` no debe aparecer en ningún componente.** Si un componente lo importa, la
traducción se filtró al render y el guard de `selectores.test.ts` lo va a decir.

## Las tres trampas del prototipo

El prototipo de `dental-agenda-main/project` es referencia visual, no código a copiar. Tiene
tres cosas mal para nuestro caso, y las tres son invisibles en pantalla:

1. **Mesial/distal fijos.** `FACE_LABELS` mapea `left: 'Mesial'` para las 32 piezas. En los
   cuadrantes 1, 4, 5 y 8 la cara izquierda es **distal**.
2. **Vestibular siempre arriba.** En la arcada inferior el vestibular va **abajo**.
3. **Colores invertidos.** `LAYER_COLORS` tiene existente azul y planificado rojo. La ficha
   de la clínica dice al revés: existente **rojo**, requerida **azul**.

Las tres se resuelven usando la capa de dominio en vez de constantes locales.

Y le faltan cuatro hallazgos de nuestro catálogo: `extraccion` (grafismo `equals`),
`retenida` (comparte `cross` con `ausente`, se distinguen por color; se llamaba
`no_erupcionada` hasta B4-1) y las dos prótesis (grafismo `span`).

---

## Iteración F1 — Render puro

Sin datos reales, sin Firebase, sin interacción. Todo recibe props y devuelve SVG.

### F1-1 · Grafismos

```
Rama:   feat/odontograma-grafismos
Toca:   src/components/odontograma/grafismos/ (nuevo)
Depende: B1-3, B1-4
```

**Qué hace.** Un componente SVG por cada grafismo del catálogo: `fill`, `cross`, `box`,
`letter`, `screw`, `stump`, `equals`. (`span` es de F3: no cabe en un diente.)

**Criterios de aceptación**

- [ ] Cada uno recibe el color como prop —el `ColorHallazgo` que devuelve `colorDe()`— y
      **ninguno decide un color por su cuenta**. El test de B1-4 lo verifica.
- [ ] Escalan: el mismo componente sirve a cualquier tamaño de diente, sin números mágicos
      calculados para un tamaño puntual.
- [ ] `ausente` y `retenida` usan el mismo `cross` y se distinguen solo por el color.
      Que se vean distintas es responsabilidad de la capa, no del grafismo.
- [ ] `equals` no existe en el prototipo: son las dos rayas paralelas de la extracción en la
      ficha en papel. Mirar la foto antes de dibujarlo.
- [ ] Un test que recorra los siete y verifique que rinden sin romper.

**Por qué importa.** Es la unidad más chica y la más reusada: la leyenda, el picker y el
arco dibujan lo mismo. Si cada uno lo dibuja a su manera, la leyenda deja de coincidir con
el diente.

### F1-2 · Componente Diente

```
Rama:   feat/odontograma-diente
Toca:   src/components/odontograma/Diente.tsx (nuevo)
Depende: F1-1, B1-5
```

**Qué hace.** El cuadrado de una pieza: cinco zonas clickeables (`top`, `right`, `bottom`,
`left`, `center`) más la capa de grafismos de diente entero encima.

**Criterios de aceptación**

- [ ] Recibe `EstadoDiente` y `VisibilidadCapas`, y pregunta con los selectores de B1-5.
      No recorre el estado a mano.
- [ ] **No importa `Cara` ni `caraSemantica`.** Habla en `FacePosition` y los selectores
      traducen.
- [ ] Una cara con hallazgo existente y requerida a la vez dibuja los dos, con el requerido
      encima. Es el caso de la obturación hecha con caries nueva sobre la misma cara.
- [ ] Un diente sin hallazgos dibuja el cuadrado limpio, sin ramas especiales.
- [ ] Estados de hover y selección sobre la zona, no sobre el diente entero.
- [ ] El número FDI es el que ve la odontóloga, no la clave `t16`.

**Por qué importa.** Es el componente que el prototipo tiene mal en los tres ejes. Es donde
se gana o se pierde toda la corrección clínica de la feature.

### F1-3 · Componente Arco

```
Rama:   feat/odontograma-arco
Toca:   src/components/odontograma/Arco.tsx (nuevo)
Depende: F1-2
```

**Qué hace.** Las filas del arco, con las piezas alineadas en columnas.

**Criterios de aceptación**

- [ ] Las filas salen de `filasDelArco(vista)`. No se arma la lista a mano.
- [ ] La grilla usa `pieza.columna`, así que encender la vista `MIXTA` es agregar filas y no
      recalcular posiciones. **La v1 renderiza solo `PERMANENTE`**, pero la grilla tiene que
      estar lista.
- [ ] Entra en el ancho de la pestaña sin scroll horizontal.
- [ ] El tamaño del diente se deriva del ancho disponible, no está fijo.

### F1-4 · Leyenda

```
Rama:   feat/odontograma-leyenda
Toca:   src/components/odontograma/Leyenda.tsx (nuevo)
Depende: F1-1
```

**Qué hace.** La tabla de referencia: cada hallazgo con su grafismo, su abreviatura y su
nombre, y qué significa cada color.

**Criterios de aceptación**

- [ ] Se genera recorriendo `HALLAZGOS`. Agregar un hallazgo al catálogo lo hace aparecer
      acá sin tocar este archivo.
- [ ] Usa los mismos componentes de F1-1 que usa el diente.
- [ ] Dice explícitamente rojo = existente, azul = requerido.

---

## Iteración F2 — Interacción

Con estado local. Todavía no persiste.

### F2-1 · Picker de hallazgos

```
Rama:   feat/odontograma-picker
Toca:   src/components/odontograma/PickerHallazgos.tsx (nuevo)
Depende: F1-2
```

**Qué hace.** El popover que se abre al clickear una zona: lista de hallazgos aplicables,
selección de capa, y borrado.

**Criterios de aceptación**

- [ ] La lista sale de `hallazgosPorAlcance()`. Al clickear una cara ofrece los de alcance
      `CARA`; al clickear la zona de diente entero, los de `DIENTE`.
- [ ] El encabezado dice el nombre clínico de la cara, vía `etiquetaCara()` — "Palatino" en
      la superior, "Lingual" en la inferior.
- [ ] La capa arranca en `capaPorDefecto` del catálogo, y se puede cambiar.
- [ ] Se puede borrar un hallazgo cargado.
- [ ] Radix/shadcn, no un popover propio. El prototipo tiene el suyo; no se porta.

### F2-2 · Conmutador de capas

```
Rama:   feat/odontograma-conmutador
Toca:   src/components/odontograma/ConmutadorCapas.tsx (nuevo)
Depende: F1-3
```

**Criterios de aceptación**

- [ ] Prende y apaga cada capa por separado. Las dos pueden estar apagadas.
- [ ] El arco reacciona vía `capasVisibles(estado, pieza, visibilidad)`.
- [ ] Arranca con las dos prendidas (`AMBAS_CAPAS`), como la ficha en papel.
- [ ] **Al conectar esto se sabrá si `capasVisibles` tiene la forma correcta.** Si no la
      tiene, cambiarla es parte de esta issue y no una regresión. (Se conectó y la forma
      aguantó: `Tooth.tsx` la consume tal cual. Ver `AGENTS.md`.)

### F2-3 · Encaje en la pestaña

```
Rama:   feat/odontograma-pestana
Toca:   la pestaña Odontograma de la ficha del paciente
Depende: F1-3, F2-2
```

**Criterios de aceptación**

- [ ] Reemplaza el placeholder actual de la pestaña.
- [ ] Estilo del proyecto: `teal-600`, `border-gray-300`, `rounded-xl`, tokens de
      `globals.css`. No la paleta slate del prototipo.
- [ ] Estados vacío, cargando y error, aunque todavía no haya datos reales que los disparen.

---

## Iteración F3 — Prótesis multi-pieza

Es otro tipo de interacción, no un hallazgo más en el picker: hay que seleccionar un tramo
de piezas y dibujar algo que las abarque.

### F3-1 · Selección de tramo

```
Rama:   feat/odontograma-seleccion-tramo
Toca:   src/components/odontograma/ (modo de selección)
Depende: F2-1
```

**Criterios de aceptación**

- [ ] Un modo explícito de selección múltiple: se entra, se eligen piezas, se confirma o se
      cancela. No se activa por accidente clickeando caras.
- [ ] Se ve qué piezas están seleccionadas mientras se elige.
- [ ] Valida en pantalla lo que B2-4 valida en el servicio: al menos dos piezas, contiguas y
      de la misma arcada. El servicio sigue siendo la autoridad; esto es para no dejar
      confirmar algo que va a rebotar.
- [ ] Escape cancela.

### F3-2 · Grafismo `span`

```
Rama:   feat/odontograma-grafismo-span
Toca:   src/components/odontograma/grafismos/
Depende: F3-1
```

**Criterios de aceptación**

- [ ] Dibuja sobre el arco, abarcando el tramo. No vive adentro de ningún diente.
- [ ] El orden de las piezas sale de `ordenVisual`, no del orden en que se seleccionaron ni
      del orden de las claves en Firebase.
- [ ] Distingue prótesis fija de removible.
- [ ] Dos vínculos sobre piezas cercanas no se pisan ilegiblemente.
- [ ] El color sale de `colorDe(vinculo.capa)`.

### F3-3 · Alta y baja de vínculos

```
Rama:   feat/odontograma-vinculos-ui
Toca:   src/components/odontograma/
Depende: F3-2
```

**Criterios de aceptación**

- [ ] Confirmar la selección abre el picker con los hallazgos de alcance `MULTI`.
- [ ] Se puede borrar un vínculo existente clickeándolo.
- [ ] Un diente dentro de un puente sin hallazgos propios sigue dibujándose limpio: el tramo
      lo dibuja el vínculo. (`tieneHallazgos` no mira vínculos, y está bien que no lo haga.)

---

## Iteración F4 — Persistencia y cierre

### F4-1 · Conexión a los servicios

```
Rama:   feat/odontograma-conexion
Depende: B2-2, B2-3, B2-4, F2-3, F3-3
```

**Criterios de aceptación**

- [x] Lee con el servicio de B2-2 y escribe con los de B2-3 y B2-4. Todo pasa por
      `useOdontograma` (`src/hooks/useOdontograma.ts`).
- [x] Ningún componente arma un path de Firebase ni importa el SDK. El `clinicId` y el
      `uid` salen del `AuthContext`; la única importación de `services/` que queda en la
      pantalla es `validarTramo`, el validador puro que B2-4 exporta a propósito.
- [x] Actualización optimista con revertido si la escritura falla, y un mensaje que diga qué
      pasó. Con 52 piezas y un click por hallazgo, esperar el round-trip se siente roto.
      El revertido está **guardado**: solo corre si lo que hay en pantalla sigue siendo lo
      que esa escritura puso, así el revert de una escritura vieja no pisa a una más nueva.
- [x] Un permission-denied no se reporta como error de red. (Ver pendientes 1.5 B: es el bug
      que ya existe en `signIn.ts`.) El motivo sale del `catch` por un `onFallo?` opcional
      —el valor de retorno de los services no cambió— y lo clasifica `clasificarFallo()`
      en `src/services/odontograma/fallos.ts`. `fallos.test.ts` fija que el mensaje de
      permiso no nombre la conexión.
- [x] Un fallo de **lectura** no se dibuja como una boca sana: el hook expone
      `estado: 'cargando' | 'listo' | 'error'` y la pestaña muestra el motivo con un botón
      de reintentar. No estaba escrito como criterio, pero un arco vacío y un arco que no
      se pudo leer se ven idénticos en pantalla.
- [x] El canal de fallos no quedó a medio usar: los **dos** services de lectura lo reportan
      y los dos callers lo muestran. `HistorialEventos` (el panel de F4-2) pasa `onFallo` a
      `getEventos` y traduce el motivo con `mensajeDeFallo(motivo, 'cargar_registro')`, en
      vez del "intentá de nuevo" fijo que tenía — que era el mismo bug que este canal vino
      a cerrar, mandando a revisar la conexión a quien no tiene permiso sobre la ficha.

**Alcance cerrado: 5 de los 7 services de escritura quedan cableados.** Los cinco son los
caminos que la UI ya dispara (CARA/DIENTE set+remove, alta/baja de vínculo).
`ejecutarHallazgoCaraRequerida` y `ejecutarHallazgoDienteRequerido` quedan afuera **a
propósito**: son el paso «requerida → ejecutada» y no hay todavía ningún control en la
pantalla que los invoque, así que cablearlos sería agregar una operación al hook que nadie
llama. Cuando exista ese botón, el patrón para sumarlos es el de `AGENTS.md` («Patrón de
optimistic-update-revert»); no hace falta rediseñar nada del hook.

### F4-2 · Panel de historial

```
Rama:   feat/odontograma-historial
Depende: B2-5, F4-1
```

**Criterios de aceptación**

- [x] Lista los eventos del paciente, del más nuevo al más viejo. `getEventos` pide
      `orderByKey()` + `limitToLast(n)` (las push IDs ya ordenan cronológicamente) y
      revierte el tramo antes de devolverlo.
- [x] Cada asiento dice qué pieza, qué cara, qué capa y la transición `de` → `a`, en
      lenguaje clínico y no en códigos. `describirEvento()` devuelve `{ piezas, ubicacion,
      capa, transicion }`; la cara sale de `etiquetaCara()` y el hallazgo de
      `hallazgoDe(codigo).nombre`, nunca el código crudo.
- [x] Un borrado se muestra como un asiento, no como una ausencia: `transicionTexto()`
      redacta las tres formas por separado —"Se registró X", "Se quitó X", "X pasó a Y"—
      y nunca un "cambió" genérico. Fijado por `formatoHistorialEventos.test.ts`.
- [x] Es de solo lectura. El log es append-only y la pantalla no puede sugerir otra cosa:
      `HistorialEventos` no tiene botón de editar, de borrar ni input, y hay un test que
      lo verifica ("lista un evento real sin ningún control de edición").

> **El panel separado quedó absorbido por el timeline al mergear `odontograma-dev`.**
> El PR #141 hizo que `HistorialTimeline` muestre las dos fuentes de la HC juntas
> —`eventos/` del odontograma y `clinicHistory/notas/`, mergeadas por `ts`— así que la
> pantalla ya no monta `HistorialEventos`: serían los mismos asientos dos veces. Los
> criterios de arriba siguen cumpliéndose, ahora dentro del timeline; lo que cambió es
> dónde se ven. El componente y sus tests siguen en el árbol sin que nadie los renderice
> — hay que borrarlos o volver a darles un lugar, no dejarlos indefinidamente así.

### F4-3 · Accesibilidad y teclado

```
Rama:   feat/odontograma-a11y
Depende: F4-1
```

**Criterios de aceptación**

- [x] Las zonas son focusables y accionables con teclado. Los 5 `<path>` de cara, el
      `<rect>` de pieza completa y el `<rect>` de selección de tramo llevan `tabIndex={0}`,
      `role="button"` y `onKeyDown` vía `activarConTeclado()`, que dispara **la misma**
      acción que el `onClick` en Enter y Espacio (con `preventDefault` en Espacio para que
      no scrollee). El rect de tramo suma `aria-pressed`, porque es un toggle.
- [x] Cada zona tiene nombre accesible con la pieza y la cara: "Pieza 16, palatino". Sale de
      `caraSemantica()` + `etiquetaCara()`, los mismos dos llamados que arma el header del
      picker — nunca de un string de cara escrito a mano.
- [x] El color **no** es el único portador de la distinción existente/requerido — hay texto
      accesible en cada elemento. Es requisito de accesibilidad y además cubre a una
      odontóloga con daltonismo, que con una ficha rojo/azul no es un caso hipotético.
      El nombre accesible nombra el hallazgo **y su capa** ("Pieza 16, palatino: caries
      requerida"), y si existente y requerida están cargadas a la vez menciona las dos.
      `VinculoSpan` suma la capa a su `aria-label`.
- [x] Contraste suficiente sobre el fondo del cuadrado. El número FDI de una pieza con
      hallazgo pasó de teal-600 (~3.74:1) a teal-700 (~5.47:1), que sí llega al AA de
      4.5:1 para texto chico. El relleno de cara se midió y pasa el 3:1 de WCAG 1.4.11 tal
      como estaba, así que no se tocó. Las cuentas quedaron como test de regresión en
      `src/__tests__/lib/odontograma/contraste.test.ts`.

### F4-4 · Cierre

```
Rama:   feat/odontograma-cierre-front
Depende: F4-3
```

**Criterios de aceptación**

- [x] Actualizar `AGENTS.md` con los componentes y sus reglas. La tabla de componentes
      cubre los nueve archivos de `ui/odontogram/`; se corrigió la fila de
      `HistorialEventos` (dejó de montarse al mergear `odontograma-dev`) y se sumaron las
      dos reglas que sobrevivieron de la sección 3 de pendientes: cómo se usa
      `colorDe(capa).fondo` y por qué `tieneHallazgos()` y `capasVisibles()` no preguntan
      lo mismo.
- [x] Vaciar de `docs/odontograma-pendientes.md` la sección 3, resolviendo o descartando cada
      entrada con el motivo escrito. Las cinco entradas se borraron; el motivo de cada una
      está en el commit de F4-4 y lo que sobrevive como regla, en `AGENTS.md`:
      - **3.1 `colorDe().fondo`** — descartada. Con los cuatro consumidores escritos, ninguno
        pone texto del mismo color encima; la variante clara que se temía necesaria no hace falta.
      - **3.4 `tieneHallazgos` vs `capasVisibles`** — descartada: la premisa dejó de valer. No
        preguntan lo mismo desde que existe el conmutador, porque solo una cruza la visibilidad.
      - **3.5 `capasVisibles` sin consumidor probado** — resuelta: `Tooth.tsx` la consume y la
        forma aguantó el contacto con el componente, sin cambiarla.
      - **3.6 Los dos espejados de `Tooth.tsx`** — resuelta: el componente traduce con
        `caraSemantica()` y el guard de `caras.test.ts` escanea todo `src` y falla si alguien
        vuelve a escribir una cara a mano.
      - **3.7 El picker no filtraba por dentición** — resuelta en F4-1 por `opcionesDelContexto()`.
- [ ] Revisión visual contra la foto de la ficha en papel, con la odontóloga si se puede.

---

## Fuera de alcance de esta planificación

**La vista de dentición temporaria.** Decisión tomada: iteración aparte, después de que
adultos funcione. Los datos, los selectores y la grilla ya la soportan desde B1 — encenderla
es agregar las dos filas y el conmutador de vista, no rehacer nada. Cuando toque, sale de
acá y de la iteración B4 del backend.
