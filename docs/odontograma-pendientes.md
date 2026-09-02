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

### 1.4 `tsc --noEmit` está en rojo y `npm run build` no lo ve

`tsc --noEmit` falla con un error en `src/__tests__/services/patients/searchPatient.test.ts`
(`VitestUtils` no asignable a `Awaitable<HookCleanupCallback>`). `npm run build` pasa
limpio sobre el mismo árbol.

Los tests **están** en el `include` del `tsconfig.json`, así que las dos cosas no deberían
diferir. Sea cual sea el motivo, la consecuencia es la que importa: **el build no es un
gate de tipos confiable**, y un error de tipos en un archivo de test no lo detecta nadie
hasta que alguien corre `tsc` a mano.

Decidir: o el CI corre `tsc --noEmit` además del build —y entonces hay que arreglar ese
error primero—, o se documenta que el typecheck real es el build y se saca `tsc` del
vocabulario del equipo. Hoy conviven las dos cosas y dan resultados distintos.

### 1.5 Hallazgos de seguridad en las reglas de Firebase

Detectado al relevar B2-1, con el JSON de reglas de la consola a la vista. **Los dos
primeros no son del odontograma: son del proyecto entero.** Se anotan acá porque acá se
encontraron; la dueña es el PO.

**Lo que NO pasa** (se descartó mirando las reglas, contra una hipótesis inicial):
`/clinics/$clinic_id` **sí** tiene aislamiento real por `clinicId` del lado del servidor,
en `.read` y en `.write`. No son reglas de test mode y los datos de pacientes no son
legibles sin autenticar. La frontera multi-tenant existe en reglas, no solo en el cliente.

#### A · Un admin puede reasignarse a otra clínica

> **Prioridad: diferida. Condición de disparo: el alta de la segunda clínica.**
>
> Con un solo cliente no hay a dónde escaparse: el único `clinicId` que existe es el
> propio, así que reasignarse no da acceso a nada nuevo. **El día que exista una segunda
> clínica en la base, esto pasa a ser un agujero explotable entre clientes y hay que
> haberlo cerrado antes de ese alta, no después.** Decisión de Santiago, comunicada al PO.
>
> Quien esté por dar de alta un segundo tenant: leer esto primero.


```json
"admins": { ".read": true, "$uid": { ".write": "$uid === auth.uid" } }
```

Un admin puede escribir su propio nodo, sin `.validate` que limite la forma — o sea que
puede reescribir su propio `clinicId`. Y el chequeo de `/clinics/$clinic_id` es
`root.child('admins').child(auth.uid).child('clinicId').val() === $clinic_id`, que después
pasa. **El aislamiento entre clínicas se autocertifica.**

La cadena completa: leer `/admins` (es público) → sacar el `clinicId` de otra clínica →
escribir el propio `clinicId` → leer los pacientes de esa clínica. Requiere ser admin de
alguna clínica, no de esa.

Arreglo posible: `clinicId` de escritura única (`.validate` que exija
`!data.exists() || data.val() === newData.val()`), o directamente `".write": false` sobre
ese campo si ningún flujo del cliente lo setea. Hay que verificar cómo se crea un admin.

#### B · `/admins` es legible sin autenticar

`".read": true` expone `userName`, `email` y `clinicId` de todos los admins. La URL de la
base va en el bundle del cliente.

No se puede cerrar sin tocar código: `signIn.ts:11` lee `/admins` entero **antes** de
autenticar, para traducir `userName` → `email`. `updateUserName.ts:9` hace lo mismo para
chequear unicidad. Cerrar la regla rompe los dos, y el `catch` de `signIn.ts:37` devuelve
`'network-error'` ante un permission-denied, así que rompería mintiendo sobre el motivo.

Salidas posibles, en orden de esfuerzo: loguear con email en vez de usuario (elimina la
lectura); un índice público mínimo `userName → email` y `/admins` detrás de `auth != null`
(reduce la superficie, sigue exponiendo emails); una Cloud Function (lo cierra del todo).
Es decisión de producto.

#### C · El `.write` de `/clinics/$clinic_id` cascadea sobre `eventos` — esto sí es nuestro

`.write` concedido en un ancestro no se puede revocar desde abajo, así que
`".write": "!data.exists()"` en `$evt` sería decorativo tal como están las reglas hoy.

Es el caso contenido: el grant está en `/clinics/$clinic_id`, no en la raíz. Se
des-cascadea bajando ese único `.write` a cada hijo que ya existe, con la misma condición
que tiene hoy. Los permisos efectivos de cada módulo quedan idénticos. El `.read` **no** se
toca: los reads tienen que seguir cascadeando.

Ojo con un segundo nivel: `odontogramas` tampoco puede llevar un `.write` propio, o
cascadea de nuevo sobre `eventos`. El `.write` va en `actual` y en `eventos/$evt` por
separado.

#### D · Las reglas no están en el repo

No hay `database.rules.json`, ni `firebase.json`, ni `.firebaserc`, ni `firebase-tools` en
`package.json`, ni nada en la historia de git. Viven solo en la consola: nunca pasaron por
un PR y nadie puede ver un diff cuando cambian. Es prerequisito de B2-1 y del emulador.


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

El front lo hace el equipo después del back — la pestaña «Odontograma» de la ficha del
paciente ya existe y es donde va a montarse. Lo que todavía no existe es el plan escrito:
`docs/odontograma-backend.md` es backend-only y B3 es soporte y cierre (seed, tests,
AGENTS.md).

**Estas entradas son el input de esa planificación.** Cuando se escriban las issues del
front, se leen de acá y se migran allá.

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

## 4. Preguntas abiertas

No son deuda técnica: son decisiones que faltan y que bloquean issues futuras.

### 4.1 ¿Quién firma cada asiento de auditoría? — DIFERIDO

> **Decidido: fuera de alcance por ahora.** El nombre y la matrícula del profesional van a
> vivir en configuración/profesionales, junto con las políticas de privacidad, en una
> etapa posterior. Hoy el asiento guarda `uid` y nada más.
>
> **Diferirlo es seguro y por qué:** agregar campos a un evento es aditivo. Los eventos ya
> escritos siguen siendo válidos —`.validate` solo corre al escribir, no sobre lo que ya
> está— y `SCHEMA_VERSION` está para marcar el corte si hiciera falta. O sea que no hay que
> reescribir historia ni migrar nada cuando se agregue. No se pinta ninguna esquina.
>
> Lo que queda pendiente es la parte legal: mientras el asiento diga solo `uid`, el registro
> no identifica al profesional actuante como pide la Ley 26.529. Es una deuda conocida, no
> un descuido.

#### El planteo original

El evento guarda `uid`. En una historia clínica odontológica lo que suele hacer falta es el
profesional y su matrícula, no el usuario del sistema — y no necesariamente son la misma
persona (una secretaria puede cargar lo que dictó la odontóloga).

**Bloquea:** B2-3. Preguntarle al PO.

### 4.2 ¿El odontograma alimenta el presupuesto?

La capa `requerida` es, literalmente, el plan de tratamiento. El sistema ya tiene
`priceTariffs`. Si el presupuesto tiene que salir del odontograma, eso es una issue que no
está en el plan y cambia el alcance.

**Bloquea:** nada hoy. Preguntarlo antes de cerrar B3 para no descubrirlo después.

### 4.3 `serverTimestamp()` vs `number` en el tipo de `ts`

`EventoOdontograma.ts` está tipado `number`, que es lo que se **lee**. Lo que se **escribe**
es el placeholder del SDK, que no es un número. Al escribir hay que resolverlo de alguna
forma (un tipo de escritura aparte, un cast acotado en el servicio, o `number | object`).

**Bloquea:** B2-3. Es decisión de implementación, no del PO — pero hay que tomarla
explícitamente y no dejar que aparezca un `as any` en el servicio.
