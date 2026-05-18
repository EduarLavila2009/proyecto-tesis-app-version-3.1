/**
 * Heurística de ciclos: componentes de bajo nivel no deben importar el barrel ../theme
 * (carga themeProvider + re-exporta todo). Usar rutas directas: theme/motion, theme/accessibility.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'src');
const LOW_LEVEL = [
  path.join('components', 'ui', 'inputs'),
  path.join('components', 'ui', 'buttons'),
  path.join('hooks'),
];

const BARREL_THEME = /from ['"]\.\.\/\.\.\/\.\.\/theme['"]|from ['"]\.\.\/theme['"]|from ['"]\.\.\/\.\.\/theme['"]/;

const issues = [];

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!name.endsWith('.js')) continue;
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    const isLow = LOW_LEVEL.some((p) => rel.startsWith(p.replace(/\\/g, '/')));
    if (!isLow) continue;
    const src = fs.readFileSync(full, 'utf8');
    if (BARREL_THEME.test(src)) {
      issues.push(rel);
    }
  }
}

walk(ROOT);

if (issues.length) {
  console.warn('Prefer direct theme imports (evita barrel en bajo nivel):');
  issues.forEach((f) => console.warn(' -', f));
  process.exit(0);
}
console.log('No barrel theme imports in low-level hooks/inputs/buttons.');
