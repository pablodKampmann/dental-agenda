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

### 1.2 `.claude/settings.local.json` está trackeado y gitignoreado a la vez

El archivo está en el repo, y `.claude` aparece dos veces en `.gitignore` (una como
archivo, una como directorio). O sea que git lo sigue porque ya estaba trackeado, pero
cualquiera que clone y lo modifique va a ver comportamiento raro.

Ahí vive `"includeCoAuthoredBy": false`, que es la configuración que evita el trailer de
Claude en los commits — o sea que **sí conviene que esté trackeado** para que le aplique a
todo el equipo. Lo que hay que arreglar es el `.gitignore`, no el archivo.

Es una decisión de equipo porque afecta a todos los repos de la gente. Hablarlo antes de tocar.

### 1.3 `tsc --noEmit` está en rojo y `npm run build` no lo ve

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

> **Decidido: se cierra con un índice `userNames/`.** Elegida entre las tres opciones que
> estaban planteadas acá. Los criterios de aceptación de abajo son la definición de
> terminado de la issue.

`".read": true` sobre `/admins` expone `userName`, `email` y `clinicId` de todos los
admins. La URL de la base va en el bundle del cliente, así que es legible por cualquiera.
No hay datos de pacientes expuestos: `/clinics/$clinic_id` sí tiene aislamiento real por
`clinicId` del lado del servidor. El alcance es el listado de admins.

**Quién lee `/admins` hoy**, verificado archivo por archivo:

| Archivo | Qué lee | ¿Autenticado? |
|---|---|---|
| `signIn.ts:10-11` | el nodo **entero**, antes de `signInWithEmailAndPassword` (línea 21) | **no** |
| `updateUserName.ts:8-9` | el nodo **entero**, para chequear unicidad | sí |
| `getUser.ts:28` | `admins/{uid}` propio | sí |
| `setRowChanges.ts:9` | `admins/{id}` propio | sí |
| `updateUserEmail.ts:17` | `admins/{id}` propio | sí |

Solo una de las cinco es anónima. Las otras cuatro sobreviven a `".read": "auth != null"`
sin tocar una línea.

**Por qué igual no alcanza con `auth != null`.** Mientras `updateUserName` chequee la
unicidad recorriendo el nodo entero, el techo del cierre es `auth != null`: cualquier
admin logueado sigue viendo el email y el `clinicId` de todos los demás. Y ese es
exactamente el primer eslabón de la cadena de
[1.5 A](#a--un-admin-puede-reasignarse-a-otra-clínica). El índice saca esa lectura, y
recién ahí `/admins` puede cerrarse a lectura por uid propio — que cierra esta entrada
del todo y le saca el primer paso a la otra.

**Las otras dos opciones, y por qué no.** *Loguear con email* elimina la lectura de
`signIn` pero deja el recorrido de `updateUserName`, así que se queda en `auth != null` y
no toca 1.5 A; además cambia el hábito de la odontóloga y, con la protección de
enumeración de Firebase, `signInWithEmailAndPassword` devuelve `auth/invalid-credential`
tanto para email inexistente como para clave incorrecta, así que la pantalla pierde la
distinción "usuario incorrecto" / "clave incorrecta" que hoy tiene en
`notSign/page.tsx:40-46`. *Una Cloud Function* llega al mismo lugar que el índice y
cuesta levantar Functions desde cero —no hay `firebase.json`, ni `.firebaserc`, ni
`functions/`, ni `firebase-tools` en `package.json`— y pasar el proyecto a Blaze.

##### El contrato

```
/userNames/{userName}: "<email>"
```

Un mapa plano: clave el `userName`, valor el email de ese admin. Es el mismo dato que ya
está en `/admins/{uid}`, dado vuelta para poder consultarlo por una sola clave en vez de
recorriendo el nodo.

```json
"userNames": {
  "$userName": {
    ".read": true,
    ".write": "auth != null && (!data.exists() || data.val() === auth.token.email) && (!newData.exists() || newData.val() === auth.token.email)",
    ".validate": "newData.isString()"
  }
},
"admins": {
  "$uid": {
    ".read": "$uid === auth.uid",
    ".write": "$uid === auth.uid"
  }
}
```

**El `.read` va en `$userName`, no en `userNames`.** Puesto en el padre, el nodo es
enumerable y se leen todos los emails de una sola lectura: no habríamos ganado nada.
Puesto en el hijo, hay que saber el `userName` para leerlo — pasa de "expone los emails
de todos" a "confirma un email si ya adivinaste el usuario". Es la diferencia entre el
cierre y el teatro.

**El `.write` cubre los tres movimientos** —crear la clave nueva, borrar la vieja,
pisarse a sí mismo— y ninguno ajeno: en un alta `data` no existe y se exige que `newData`
sea el propio email; en una baja `newData` no existe y se exige que `data` lo sea. Sin
esa condición, cualquier admin se apropia del `userName` de otro apuntándolo a su propio
email y le roba el login.

**Criterios de aceptación**

- [ ] `signIn` resuelve el email leyendo `userNames/{userName}` —una sola clave— y no lee
      `/admins` nunca más.
- [ ] `updateUserName` chequea la unicidad leyendo `userNames/{nuevo}` y tampoco recorre
      `/admins`.
- [ ] `updateUserName` escribe `/admins/{uid}/userName`, `userNames/{nuevo}` y
      `userNames/{viejo}: null` en **un solo `update()` multi-path**. Si se parte a la
      mitad, ese admin no se puede loguear más: o el índice apunta a una clave que ya no
      existe, o quedan dos claves vivas para el mismo admin. Es el mismo patrón atómico
      que usa `setHallazgo.ts`.
- [ ] `/admins` pierde el `".read": true` y queda en `$uid === auth.uid`.
- [ ] `getUser`, `setRowChanges` y `updateUserEmail` siguen andando **sin cambios** — los
      tres leen su propio nodo. Si alguno necesitó tocarse, algo se entendió mal.
- [ ] Un `userName` que no es clave válida de Realtime Database (contiene `.`, `#`, `$`,
      `[`, `]` o `/`) no entra al índice. Hoy `updateUserName` acepta cualquier string;
      con el índice, un punto en el userName rompe el login de ese admin. Se rechaza en
      `updateUserName` con un código propio, no se deja fallar contra la regla.
- [ ] Hay tests de `signIn` y `updateUserName` con el mock de `firebase/database` que ya
      usan los tests de `appointments` y `patients`. Hoy no hay un solo test de
      `services/auth/` ni de `services/config/`.
- [ ] `npm run test:run` y `npm run build` pasan.

**Lo que esta issue NO hace.** No toca el `.write` de `/admins/$uid`, así que
[1.5 A](#a--un-admin-puede-reasignarse-a-otra-clínica) sigue abierta: un admin todavía
puede reescribir su propio `clinicId`. Lo que sí le saca es el primer eslabón —ya no
puede leer el `clinicId` de otra clínica para saber a dónde saltar—. Esa entrada sigue
diferida hasta el alta de la segunda clínica.

##### El orden de publicación, que no es negociable

El índice y el cierre de la regla no pueden ir en el mismo movimiento, y hay un detalle
que lo fuerza: **la misma regla que protege el índice impide sembrarlo.** Un script
corriendo como Santiago solo puede escribir su propia entrada — para las de los demás
admins, `newData.val() === auth.token.email` da `false`. No hay script que resuelva eso.

1. Contar los admins con `/admins` todavía legible. Son pocos: no hay alta de admin en el
   código —`createUserWithEmailAndPassword` no aparece en todo `src/`—, se crean a mano en
   la consola.
2. Publicar **solo** el bloque `userNames`, con `".write": "auth != null"` provisorio.
   `/admins` sin tocar. Es aditivo: no rompe nada de lo que anda hoy.
3. Cargar las entradas de los admins existentes, a mano o con un botón en `/dev`.
4. Endurecer el `.write` de `userNames` a la condición final y verificar que un admin no
   puede pisar la clave de otro.
5. Mergear el código. Verificar el login de **cada** admin con `/admins` todavía abierto:
   el código nuevo anda con las reglas viejas, así que este paso es reversible.
6. Recién ahí publicar el cierre de `/admins`.

Invertir 5 y 6 deja a todo el mundo afuera del sistema hasta que se despubliquen las
reglas.

**A verificar en el paso 4, no asumir:** que `auth.token.email` está poblado. Debería
estarlo —el único proveedor del proyecto es email/password— pero es la condición de la
que cuelga toda la regla del índice.

**Deuda operativa que queda abierta:** cada admin nuevo creado a mano en la consola
necesita su entrada en `userNames/` cargada a mano también, o no puede loguearse.
Avisarle al PO. El día que exista un alta de admin en el código, ese flujo escribe las
dos cosas juntas.

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

### 3.4 `tieneHallazgos` y `capasVisibles` preguntan lo mismo

`tieneHallazgos(e, p)` es equivalente a `capasVisibles(e, p).length > 0`. Comparten el
recorrido así que no cuesta performance, pero son dos formas de preguntar una cosa.

Cuando el componente esté escrito, si usa una sola, borrar la otra.

### 3.5 `capasVisibles` es el único selector sin consumidor probado

La semántica es la intersección entre lo prendido en el conmutador y lo que la pieza tiene
cargado, en orden `existente, requerida` (para que lo requerido quede dibujado encima de lo
existente). Está razonada pero se inventó sin un componente que la use.

Es la primera candidata a cambiar de forma cuando el conmutador exista de verdad. Que
cambie no es una regresión.

### 3.6 Al portar `Tooth.tsx` hay **dos** espejados que corregir

Está en `docs/odontograma-backend.md`, sección "Tres cosas para tener a mano al portar",
pero se repite acá porque es el error más caro de la feature:

- **Horizontal:** `FACE_LABELS` del prototipo mapea `left: 'Mesial'` para las 32 piezas.
  En los cuadrantes 1, 4, 5 y 8 la cara izquierda es **distal**.
- **Vertical:** el prototipo dibuja el vestibular arriba en las dos arcadas. En la arcada
  inferior el vestibular va **abajo**.

Los dos se resuelven usando `caraSemantica()` de `caras.ts`, tanto para guardar como para
pintar. Ninguno de los dos se ve en pantalla si está mal: el dibujo queda coherente y
espejado, y el dato clínico queda falso en media boca.

### 3.7 `HallazgoPicker` no filtra por dentición (B4-1) — criterio para F4-1

El catálogo declara `denticiones` por entrada y los services (`setHallazgoDiente`,
`setVinculo`) lo hacen cumplir, pero el picker (`HallazgoPicker.tsx`) todavía arma su
lista solo con `hallazgosPorAlcance()`, sin cruzarla contra la dentición de la pieza
clickeada. Hoy no importa: la UI ni siquiera escribe contra Firebase todavía. Pero
apenas F4-1 la conecte, sigue ofreciendo "Implante" o "Prótesis fija" sobre un diente de
leche.

**El flujo si no se arregla:** la odontóloga elige "Implante" sobre una pieza temporaria →
la UI lo dibuja optimista → el service lo rechaza (`{ ok: false, error }`) → hay que
revertir el dibujo optimista y mostrarle el error. Funciona (el service no permite que se
guarde mal), pero es una mala experiencia evitable: se ofreció algo que nunca iba a
guardarse.

**Criterio de aceptación para F4-1:** `HallazgoPicker` filtra su lista con el mismo
`aplicaADenticion(codigo, pieza.denticion)` que ya usan los services —importado, no
reimplementado— así que un implante no aparece nunca como opción sobre una temporaria. La
validación del service se queda igual: el filtro del picker es UX, la autoridad sigue
siendo el backend.

### 3.8 El historial de la pantalla deja editar y borrar asientos

`HistorialTimeline` expone `onEditarTexto` y `onEliminar`, y `clinicHistory/page.tsx` los
implementa contra estado local. Hoy da igual, porque nada de eso se persiste.

Apenas F4-1 conecte la escritura, la pantalla va a ofrecer dos operaciones que el servidor
rechaza siempre: `eventos/$evt` tiene `".write": "<cond> && !data.exists()"` en
`database.rules.json`. Y F4-2 lo pide explícito: *"Es de solo lectura. El log es
append-only y la pantalla no puede sugerir otra cosa."*

Lo que hay que decidir antes de escribir F4-1 —no después— es si el timeline son **dos
cosas distintas metidas en un componente**: notas libres del profesional, que se editan y
que hoy no se guardan en ningún lado, y asientos de auditoría derivados de `eventos`, que
son inmutables. Si son dos, se separan; si es una sola, se le saca la edición. Lo que no
puede quedar es un botón de borrar sobre un log append-only.

### 3.9 Los vínculos no se dibujan: la pantalla descarta `vinculos` de la lectura

`getOdontograma` devuelve `{ dientes, vinculos, meta }`, pero `clinicHistory/page.tsx` usa
solo `data.dientes`. `OdontogramaGrid` ni siquiera recibe `vinculos` como prop.

El grafismo `span` ya existe (`FindingGlyph.tsx`), así que lo que falta es el render sobre
el arco (F3-2) y el alta y baja (F3-3): el botón "Aplicar prótesis" hoy registra una
entrada en el historial local y **nunca llama a `setVinculo`**.

Consecuencia concreta, y la que confunde: el puente de tres piezas que siembra
`runSeedOdontograma` está en la base y no se ve en pantalla. Es fácil leerlo como "el seed
no anda" cuando lo que falta es el dibujo.

### 3.10 `page.tsx` importa `validarTramo` desde un service

`clinicHistory/page.tsx` importa `validarTramo` de `@/services/odontograma/setVinculo`, que
a su vez importa `firebase/database`. La función es dominio puro: razona con `ordenVisual`
y `arcada` y no toca Firebase.

Como está, la pantalla arrastra el SDK al bundle por una función que no lo necesita, y el
criterio de F4-1 —"ningún componente arma un path de Firebase ni importa el SDK"— queda en
zona gris. El lugar es `src/lib/odontograma/`; moverlo es cambiar un import, y el service
la sigue usando desde ahí.

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

### 4.4 Eventos legado con un código de catálogo que ya no existe (`no_erupcionada` → `retenida`, B4-1)

> **Pendiente de decisión — la toma Santiago.** No implementado a propósito: es una
> decisión de producto sobre qué hacer con la historia clínica, no algo que se resuelva
> con código a ciegas.

**El planteo.** B4-1 renombró el código de catálogo `no_erupcionada` a `retenida` — y no
fue solo el nombre, cambió el significado (dejó de ser "todavía no le tocó salir" y pasó a
ser una anomalía clínica real). `codigo` no es un identificador interno: es un valor que se
**persiste** en dos lugares —

- `actual/dientes/{pieza}/diente/{capa}` (mutable)
- `eventos/{evt}/de` y `eventos/{evt}/a` (append-only, `database.rules.json` tiene
  `".write": "<cond> && !data.exists()"` en `eventos/$evt` — un evento ya escrito no se
  puede tocar sin despublicar reglas)

Si existe algún evento viejo con `de` o `a` igual a `"no_erupcionada"`, hoy
`getEventos.ts` lo descarta **entero** (`validarCodigoTransicion` rechaza el código
inválido, y `validarEvento` devuelve `null` para todo el asiento apenas un campo falla —
ver `getEventos.ts`, función `validarEvento`, ramas CARA/DIENTE/MULTI). No hay forma de
arreglar ese evento porque el nodo es inmutable: la decisión es qué hace la **lectura** con
él, para siempre — no se puede parchear una vez y olvidarse.

**Opciones**

- **(A) Tolerar códigos legado en la lectura, mostrarlos con su nombre viejo, congelado.**
  `getEventos` reconoce `no_erupcionada` (y cualquier código futuro que se retire) contra
  un vocabulario legado aparte del catálogo vivo, y el evento se muestra con una etiqueta
  fija tipo "Pieza no erupcionada (código de catálogo retirado)" — **nunca** con el nombre
  ni el sentido de `retenida`, porque no es lo mismo que se registró en su momento.
  Costo: el tipo `EventoOdontograma`/`CodigoHallazgoDiente` ya no alcanza para tipar lo que
  devuelve la lectura de eventos —hay que ensanchar el tipo de lectura o envolver el
  resultado— y cada rename futuro agrega una entrada a ese vocabulario legado que no se
  borra nunca. A favor: ningún asiento de la historia clínica desaparece.
- **(B) Descartar el evento (comportamiento actual, sin cambios).** Costo cero. En contra:
  un asiento real de la historia clínica desaparece sin dejar rastro visible —el
  `console.error` no lo ve nadie en producción— la primera vez que se renombra o se saca un
  código del catálogo. Es exactamente lo que B4-2 (`docs/odontograma-backend.md`) advierte
  para el caso de exfoliación: perder historia es dejar de tener una historia clínica.
- **(C) Punto medio: no decodificar el código, pero no perder el asiento.** La lectura
  devuelve el evento con un campo tipo `legado: true` y sin `de`/`a` interpretados, y la UI
  lo muestra como "hubo un cambio acá que ya no se puede mostrar (código de catálogo
  retirado)". Menos informativo que (A), pero no exige mantener un vocabulario legado
  creciendo dentro del tipo de dominio — el costo se paga en la UI, no en `tipos.ts`.

**Recomendación: (A).** Es una historia clínica real, con implicancia legal (ver [4.1](#41-quién-firma-cada-asiento-de-auditoría--diferido)):
perder un asiento porque el catálogo cambió de vocabulario es peor que cargar con un
vocabulario legado de solo lectura que crece uno por rename. La alternativa (B, lo que hay
hoy) es la más barata pero es la que el propio proyecto ya identificó como el error caro en
B4-2.

**Antes de decidir, falta un dato que nadie en este repo puede mirar sin acceso a la
consola de Firebase — hace falta que Santiago lo chequee:**

1. Exportar el JSON del proyecto (consola de Firebase → Realtime Database → menú de
   tres puntos sobre el nodo raíz o sobre `clinics` → **Export JSON**) y buscar (Ctrl+F)
   la cadena literal `no_erupcionada`.
2. Si aparece bajo algún `.../actual/dientes/{clave}/diente/{capa}`: hay datos vivos que
   migrar. Ese nodo **sí** es mutable, así que un script de migración (mismo patrón que
   `src/dev/migrateAddTimestamps.ts`, disparado desde un botón en `src/app/dev/page.tsx`)
   puede reescribir `"no_erupcionada"` → `"retenida"` ahí. **No escrito todavía** porque no
   se sabe si hace falta — si el export da negativo, no hace falta ningún script.
3. Si aparece bajo algún `.../eventos/{evt}/de` o `.../eventos/{evt}/a`: ese dato es
   exactamente el caso de la opción (A)/(B)/(C) de arriba. Ahí no hay migración posible
   (el nodo es append-only) — la decisión de arriba es la que determina qué hace
   `getEventos` con ese asiento, no una migración.
4. Evidencia indirecta (no reemplaza el chequeo anterior): al momento de este rename, la
   UI del odontograma todavía no escribe a Firebase —`AGENTS.md` documenta que el picker
   actualiza estado local, no `actual/`, hasta que se conecte F4-1— y el único código que
   alguna vez llamó a `setHallazgoDiente` contra datos reales es
   `src/dev/seedOdontograma.ts`, que nunca sembró `no_erupcionada`. Es una señal fuerte de
   que no hay datos afectados, pero no es prueba: no cubre ediciones manuales hechas desde
   la consola de Firebase, ni un seed o prototipo anterior a este repo.

**Bloquea:** nada hoy (0 usuarios reales tocando el odontograma todavía, ver punto 4), pero
hay que resolverlo antes de que el picker empiece a escribir contra Firebase de verdad
(F4-1) — después de eso, cada rename de catálogo es un evento real de un paciente real.

---

## 5. Lección de B4-1: los códigos del catálogo son valores persistidos

`codigo` en `catalogo.ts` no es un identificador interno de refactor libre: es lo que
queda escrito en `actual/dientes/{pieza}/diente|caras/{capa}` y en `eventos/{evt}/de|a`.
Renombrar uno —como pasó con `no_erupcionada` → `retenida` en B4-1— es una **migración de
datos**, no un cambio de nombre de variable: hay que auditar si hay datos con el código
viejo (`actual`, mutable) y decidir qué hacer con los que ya están en el log append-only
(`eventos`, inmutable) **antes** de asumir que renombrar en el código alcanza. Ver
[4.4](#44-eventos-legado-con-un-código-de-catálogo-que-ya-no-existe-no_erupcionada--retenida-b4-1)
para el caso concreto que motivó esta entrada.

La próxima vez que alguien renombre o saque una entrada del catálogo: repetir el chequeo
de 4.4 (exportar y buscar el código viejo) antes de tocar `catalogo.ts`, no después.

---

## 6. `runSeedPatients` no es idempotente

Detectado al resolver B4-3 (el seed pediátrico necesitaba poder crear a su propio
paciente sin depender de que alguien hubiera apretado antes "Seed Pacientes").

`runSeedPatients` (`src/dev/seedPatients.ts`) recorre la lista que recibe e inserta cada
paciente con `SetPatients` sin chequear si ya existe uno con el mismo nombre/apellido (o
DNI). Apretar "Insertar pacientes" dos veces duplica los doce pacientes originales; lo
mismo pasa con "Insertar 100 pacientes adicionales" y con cualquier lista nueva que se le
pase (`SEED_PATIENTS_EXTRA`, `[SEED_PATIENT_PEDIATRICO]`, ...).

B4-3 **no** resuelve esto en general — sería tocar el comportamiento de un botón que ya
usan los otros seeds, y el issue puntual no lo pedía. Lo que hace `runSeedOdontogramaPediatrico`
es acotado: busca a su paciente por nombre/apellido con `getAllPatients()` antes de crear
nada, y solo llama a `runSeedPatients([SEED_PATIENT_PEDIATRICO])` si no lo encuentra — así
que ese caso puntual queda protegido sin cambiar `runSeedPatients` ni los demás botones de
`/dev`.

**Arreglo real, si hace falta:** que `runSeedPatients` chequee existencia (por nombre +
apellido, o por DNI, que es el dato que no debería repetirse en la vida real) antes de cada
`SetPatients`, y salte al que ya está en vez de insertarlo de nuevo — mismo criterio que ya
usan `runSeedOdontograma`/`runSeedOdontogramaPediatrico` con `dientes`.

**Bloquea:** nada hoy — es una herramienta de dev, no un flujo de producción, y el riesgo
es "apretar el botón de más" con un humano de por medio, no una corrupción silenciosa de
datos reales.
