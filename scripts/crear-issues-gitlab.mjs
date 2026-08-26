#!/usr/bin/env node
/**
 * Crea en GitLab las issues del odontograma a partir de docs/odontograma-backend.md.
 *
 * El documento es la única fuente de verdad: este script no tiene los issues
 * adentro, los lee. Si el documento cambia, se vuelve a correr y listo.
 *
 * Uso:
 *   export GITLAB_TOKEN=glpat-xxxxxxxxxxxx
 *   export GITLAB_PROJECT=grupo/dental-agenda      # o el ID numérico
 *   node scripts/crear-issues-gitlab.mjs --dry      # previsualiza, no crea nada
 *   node scripts/crear-issues-gitlab.mjs            # crea las que falten
 *
 * Opcional:
 *   export GITLAB_HOST=https://gitlab.com           # por defecto gitlab.com
 *
 * Es idempotente: antes de crear busca si ya existe una issue con ese título.
 * Correrlo dos veces no duplica nada.
 */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HOST = process.env.GITLAB_HOST ?? 'https://gitlab.com';
const TOKEN = process.env.GITLAB_TOKEN;
const PROJECT = process.env.GITLAB_PROJECT;
const DRY = process.argv.includes('--dry');

const AQUI = dirname(fileURLToPath(import.meta.url));
const DOC = resolve(AQUI, '..', 'docs', 'odontograma-backend.md');

if (!DRY && (!TOKEN || !PROJECT)) {
  console.error('Faltan GITLAB_TOKEN y/o GITLAB_PROJECT. Probá con --dry para previsualizar.');
  process.exit(1);
}

// --- parseo del documento -----------------------------------------------

/** Divide el markdown en issues: una por cada encabezado `### B1-1 · Título`. */
function parsearIssues(md) {
  const lineas = md.split('\n');
  const issues = [];
  let iteracion = null;
  let actual = null;

  for (const linea of lineas) {
    const mIter = linea.match(/^## Iteración (B\d)\s*[—-]\s*(.+)$/);
    if (mIter) {
      iteracion = { etiqueta: mIter[1], nombre: mIter[2].trim() };
      continue;
    }

    const mIssue = linea.match(/^### (B\d-\d)\s*·\s*(.+)$/);
    if (mIssue) {
      if (actual) issues.push(actual);
      actual = {
        id: mIssue[1],
        titulo: `${mIssue[1]} · ${mIssue[2].trim()}`,
        iteracion,
        cuerpo: [],
      };
      continue;
    }

    // un `## ` cualquiera cierra la issue en curso (fin de la sección de issues)
    if (/^## /.test(linea) && actual) {
      issues.push(actual);
      actual = null;
    }

    if (actual) actual.cuerpo.push(linea);
  }
  if (actual) issues.push(actual);

  return issues.map(i => ({
    ...i,
    cuerpo: i.cuerpo.join('\n').replace(/\n*^---\s*$\n*/gm, '\n').trim(),
  }));
}

/** Le agrega a cada issue el bloque de cómo se implementa. */
function armarCuerpo(issue) {
  return `${issue.cuerpo}

---

### Cómo se implementa

Este issue **no se le pega al agente tal cual**: el contrato completo vive en el repo y el agente lo lee. Copiá esto y nada más:

\`\`\`
Leé AGENTS.md y docs/odontograma-backend.md.
Implementá la issue ${issue.id}.
Los criterios de aceptación del documento son la definición de terminado.
Antes de escribir código, decime si algo del contrato te resulta ambiguo.
\`\`\`

Después, la metodología de siempre: rama primero, \`npm run build\` y \`npm run test:run\` antes de dar por terminado, y si la tarea agregó un patrón o un nodo nuevo, actualizar \`AGENTS.md\` **antes** del commit.

\`\`\`bash
git checkout -b <rama del issue>
git commit -m "tipo: título en español" -m "- cambio específico 1" -m "- cambio específico 2"
\`\`\``;
}

// --- API de GitLab -------------------------------------------------------

const api = (ruta, opciones = {}) =>
  fetch(`${HOST}/api/v4${ruta}`, {
    ...opciones,
    headers: {
      'PRIVATE-TOKEN': TOKEN,
      'Content-Type': 'application/json',
      ...(opciones.headers ?? {}),
    },
  });

async function yaExiste(titulo) {
  const r = await api(
    `/projects/${encodeURIComponent(PROJECT)}/issues?search=${encodeURIComponent(titulo)}&in=title&state=all`,
  );
  if (!r.ok) throw new Error(`Búsqueda falló: ${r.status} ${await r.text()}`);
  const encontradas = await r.json();
  return encontradas.find(i => i.title === titulo) ?? null;
}

async function crear(issue) {
  const r = await api(`/projects/${encodeURIComponent(PROJECT)}/issues`, {
    method: 'POST',
    body: JSON.stringify({
      title: issue.titulo,
      description: armarCuerpo(issue),
      labels: ['odontograma', 'backend', issue.iteracion?.etiqueta].filter(Boolean).join(','),
    }),
  });
  if (!r.ok) throw new Error(`Creación falló: ${r.status} ${await r.text()}`);
  return r.json();
}

// --- main ----------------------------------------------------------------

const md = await readFile(DOC, 'utf8');
const issues = parsearIssues(md);

if (issues.length === 0) {
  console.error(`No encontré issues en ${DOC}. ¿Cambió el formato de los encabezados?`);
  process.exit(1);
}

console.log(`\n${issues.length} issues encontradas en el documento:\n`);
for (const i of issues) {
  console.log(`  ${i.id.padEnd(6)} ${i.titulo.slice(i.id.length + 3).padEnd(46)} [${i.iteracion?.etiqueta ?? '?'}]`);
}

if (DRY) {
  console.log('\n--- Previsualización de la primera ---\n');
  console.log(`TÍTULO: ${issues[0].titulo}`);
  console.log(`LABELS: odontograma, backend, ${issues[0].iteracion?.etiqueta}`);
  console.log(`\n${armarCuerpo(issues[0])}\n`);
  console.log('Modo --dry: no se creó nada. Sacá el flag para crearlas.');
  process.exit(0);
}

console.log(`\nCreando en ${PROJECT}…\n`);
let creadas = 0;
let salteadas = 0;

for (const issue of issues) {
  const existente = await yaExiste(issue.titulo);
  if (existente) {
    console.log(`  ⊘ ${issue.id}  ya existe → #${existente.iid}`);
    salteadas++;
    continue;
  }
  const nueva = await crear(issue);
  console.log(`  ✓ ${issue.id}  creada → #${nueva.iid}  ${nueva.web_url}`);
  creadas++;
}

console.log(`\n${creadas} creadas, ${salteadas} ya existían.`);
if (creadas > 0) {
  console.log('\nFalta a mano: enlazar las dependencias entre issues (el campo "Depende" de cada una).');
}
