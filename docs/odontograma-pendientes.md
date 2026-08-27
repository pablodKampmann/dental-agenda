# Odontograma — pendientes

Cosas detectadas durante la revisión de las issues que **no** se arreglaron en el momento,
con el motivo. Están ordenadas por cuándo vencen, no por tema.

Esto no es una lista de deseos: cada entrada salió de leer código ya mergeado. Si una se
resuelve, se borra de acá; si se decide no hacerla, se borra igual pero dejando escrito por qué.

Referencia del contrato: `docs/odontograma-backend.md`.

---

## 1. Antes de mergear `odontograma-dev` a `dev`

### 1.1 Sacar `odontograma-dev` del trigger de CI

`.github/workflows/ci.yml` tiene hoy:

```yaml
on:
  pull_request:
    branches: [dev, main, odontograma-dev]
```

`odontograma-dev` se agregó para que los PRs de las issues del odontograma corrieran el
build. Cuando la rama de integración se mergee a `dev` y se borre, esa línea queda
apuntando a una rama que no existe. Sacarla en ese mismo PR.

### 1.2 `Toast.test.tsx` — 2 tests fallando

Vienen de antes del odontograma: fallan en `dev` sin ninguno de estos cambios.
Ninguna issue del odontograma los toca, así que el PR de integración va a llegar a `dev`
con el check en rojo si no se resuelven antes.

**Decidir:** issue aparte para arreglarlos, o dejarlos documentados como conocidos.
No mergear a `dev` sin haber decidido cuál de las dos.

### 1.3 `.claude/settings.local.json` está trackeado y gitignoreado a la vez

El archivo está en el repo, y `.claude` aparece dos veces en `.gitignore` (una como
archivo, una como directorio). O sea que git lo sigue porque ya estaba trackeado, pero
cualquiera que clone y lo modifique va a ver comportamiento raro.

Ahí vive `"includeCoAuthoredBy": false`, que es la configuración que evita el trailer de
Claude en los commits — o sea que **sí conviene que esté trackeado** para que le aplique a
todo el equipo. Lo que hay que arreglar es el `.gitignore`, no el archivo.

Es una decisión de equipo porque afecta a todos los repos de la gente. Hablarlo antes de tocar.

---

## 2. Para B2-2 · Lectura del odontograma

### 2.1 La validación del dato crudo va en la lectura, no en los selectores

`capasConHallazgo()` en `selectores.ts` hace `hallazgos.existente !== undefined` y confía
en que la forma que llega de Firebase sea la del tipo. Está bien que confíe: validar el
dato crudo es trabajo de la capa de lectura.

Cuando se escriba B2-2, la lectura tiene que garantizar que lo que sale de ahí cumple
`DientesPorClave` de verdad —códigos de hallazgo del catálogo, claves de pieza válidas,
capas conocidas— para que los selectores no tengan que desconfiar. Si un nodo viene
corrupto, decidir ahí qué se hace (descartar la pieza, loguear, romper) y escribirlo.

---

## 3. Para cuando se planifique el front

**Ojo: no hay ninguna issue que vaya a levantar esto.** `docs/odontograma-backend.md` es
backend-only y B3 es soporte y cierre (seed, tests, AGENTS.md). El trabajo de portar
`Tooth.tsx` y armar la pantalla no está planificado todavía. Estas entradas tienen que
migrar al documento de planificación del front cuando exista.

### 3.1 `colorDe().fondo` es un color sólido, no sirve para un chip

`caras.ts` devuelve `fondo: 'bg-red-600'` junto con `texto: 'text-red-600'`. El comentario
dice que `fondo` es para chips de la leyenda y badges del picker, pero rojo 600 sobre rojo
600 no se lee.

Un chip real quiere `bg-red-50` con `text-red-600`. Cuando exista el primer componente que
consuma esto, o se agrega una variante `fondoSuave`, o se cambia `fondo` a la versión
clara y se renombra la actual. No se tocó antes porque no hay consumidor y la forma
correcta se ve recién con el componente en la mano.

### 3.2 El guard de "un solo lugar decide el color" tiene un agujero de ruta

El test de `caras.test.ts` escanea los archivos cuya **ruta** matchea `/odontogram/i`.
Un componente en `src/components/odontograma/Tooth.tsx` queda cubierto; uno en
`src/components/dental/Tooth.tsx` **no**, y el guard pasa en verde sin haber mirado nada.

Cuando se defina dónde viven los componentes del odontograma, revisar que caigan adentro
del escaneo — o cambiar el criterio de "la ruta dice odontogram" a una lista explícita.

### 3.3 La lista de familias de color del guard está incompleta

Misma regex: cubre `red|blue|rose|sky|indigo|violet|orange|amber|green|emerald` y omite
`purple`, `pink`, `cyan`, `yellow`, `lime`, `fuchsia`. `teal` está omitido a propósito
(es el color de la app). El riesgo real es rojo/azul, así que no es urgente, pero si
alguien pinta un hallazgo en `text-purple-600` el guard no se entera.

### 3.4 `filasDelArco` devuelve claves y el render va a necesitar la pieza entera

`selectores.ts` devuelve `ClavePieza[][]`, que es lo que indexa el estado. Pero el
componente necesita `cuadrante`, `arcada` y `tipo` de cada pieza —para `etiquetaCara()` y
para dibujar— o sea un `piezaDeClave()` por diente en cada render.

Cumple el contrato tal como está escrito. Si al escribir el componente resulta molesto,
cambiarlo a devolver `Pieza[][]` es contenido y no toca la persistencia.

### 3.5 `tieneHallazgos` y `capasVisibles` preguntan lo mismo

`tieneHallazgos(e, p)` es equivalente a `capasVisibles(e, p).length > 0`. Comparten el
recorrido así que no cuesta performance, pero son dos formas de preguntar una cosa.

Cuando el componente esté escrito, si usa una sola, borrar la otra.

### 3.6 `capasVisibles` es el único selector sin consumidor probado

La semántica es la intersección entre lo prendido en el conmutador y lo que la pieza tiene
cargado, en orden `existente, requerida` (para que lo requerido quede dibujado encima de lo
existente). Está razonada pero se inventó sin un componente que la use.

Es la primera candidata a cambiar de forma cuando el conmutador exista de verdad. Que
cambie no es una regresión.

### 3.7 Al portar `Tooth.tsx` hay **dos** espejados que corregir

Está en `docs/odontograma-backend.md`, sección "Tres cosas para tener a mano al portar",
pero se repite acá porque es el error más caro de la feature:

- **Horizontal:** `FACE_LABELS` del prototipo mapea `left: 'Mesial'` para las 32 piezas.
  En los cuadrantes 1, 4, 5 y 8 la cara izquierda es **distal**.
- **Vertical:** el prototipo dibuja el vestibular arriba en las dos arcadas. En la arcada
  inferior el vestibular va **abajo**.

Los dos se resuelven usando `caraSemantica()` de `caras.ts`, tanto para guardar como para
pintar. Ninguno de los dos se ve en pantalla si está mal: el dibujo queda coherente y
espejado, y el dato clínico queda falso en media boca.

---

## 4. Nits

Se arreglan cuando alguien pase por el archivo. No justifican un commit propio.

- **`caras.ts`**: el comentario de `colorDe` dice "las cuatro formas" y son cinco
  (`texto`, `fondo`, `borde`, `relleno`, `trazo`).
- **`selectores.test.ts`**: el test `\bCara\b` depende de los word boundaries para no dar
  falso positivo sobre `CodigoHallazgoCara`. Si alguien lo "arregla" a `/Cara/` empieza a
  fallar y va a parecer que el módulo está mal. Dejar un comentario diciéndolo.

---

## 5. Preguntas abiertas

No son deuda técnica: son decisiones que faltan y que bloquean issues futuras.

### 5.1 ¿Quién firma cada asiento de auditoría?

El evento guarda `uid`. En una historia clínica odontológica lo que suele hacer falta es el
profesional y su matrícula, no el usuario del sistema — y no necesariamente son la misma
persona (una secretaria puede cargar lo que dictó la odontóloga).

**Bloquea:** B2-3. Preguntarle al PO.

### 5.2 ¿El odontograma alimenta el presupuesto?

La capa `requerida` es, literalmente, el plan de tratamiento. El sistema ya tiene
`priceTariffs`. Si el presupuesto tiene que salir del odontograma, eso es una issue que no
está en el plan y cambia el alcance.

**Bloquea:** nada hoy. Preguntarlo antes de cerrar B3 para no descubrirlo después.

### 5.3 `serverTimestamp()` vs `number` en el tipo de `ts`

`EventoOdontograma.ts` está tipado `number`, que es lo que se **lee**. Lo que se **escribe**
es el placeholder del SDK, que no es un número. Al escribir hay que resolverlo de alguna
forma (un tipo de escritura aparte, un cast acotado en el servicio, o `number | object`).

**Bloquea:** B2-3. Es decisión de implementación, no del PO — pero hay que tomarla
explícitamente y no dejar que aparezca un `as any` en el servicio.
