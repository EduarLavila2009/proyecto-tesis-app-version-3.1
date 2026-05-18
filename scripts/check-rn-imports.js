const fs = require('fs');
const path = require('path');

const components = [
  'View', 'Text', 'ScrollView', 'TextInput', 'Image', 'TouchableOpacity',
  'FlatList', 'Pressable', 'ActivityIndicator', 'Switch',
  'KeyboardAvoidingView', 'Modal', 'Alert',
];

/** Componentes que pueden venir de otros paquetes (no exigir react-native). */
const EXTERNAL_COMPONENTS = {
  SafeAreaView: ['react-native-safe-area-context'],
  StatusBar: ['expo-status-bar', 'react-native'],
};

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory() && f !== 'node_modules') walk(p, files);
    else if (/\.(js|jsx|ts|tsx)$/.test(f)) files.push(p);
  }
  return files;
}

const files = [
  ...walk('src'),
  'App.js',
  'index.js',
].filter((f) => fs.existsSync(f));

const issues = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const rnMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*['"]react-native['"]/);
  const rnImports = rnMatch
    ? rnMatch[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim())
    : [];

  function hasExternalImport(comp) {
    const pkgs = EXTERNAL_COMPONENTS[comp];
    if (!pkgs) return false;
    return pkgs.some((pkg) => {
      const re = new RegExp("from\\s*['\"]" + pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "['\"]");
      return re.test(content);
    });
  }

  for (const comp of components) {
    const jsxRe = new RegExp('<' + comp + '[\\s/>]');
    if (jsxRe.test(content) && !rnImports.includes(comp) && !hasExternalImport(comp)) {
      const lineNum = content.split('\n').findIndex((l) => jsxRe.test(l)) + 1;
      issues.push({ file, comp, line: lineNum, rnImports: rnImports.join(', ') || '(ninguno)' });
    }
  }
}

console.log(JSON.stringify(issues, null, 2));
console.log('TOTAL:', issues.length);
