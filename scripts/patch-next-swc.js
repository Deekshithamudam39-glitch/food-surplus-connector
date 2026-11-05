const fs = require('fs');
const path = require('path');

const swcIndexPath = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'build', 'swc', 'index.js');

if (!fs.existsSync(swcIndexPath)) {
  console.log('SWC index.js not found, skipping patch.');
  process.exit(0);
}

let content = fs.readFileSync(swcIndexPath, 'utf8');

// 1. Fix pkgPath in loadWasm to properly resolve via require.resolve when importPath is empty
const target1 = 'let pkgPath = pkg;\n            if (importPath) {';
const replacement1 = `let pkgPath = pkg;
            if (importPath) {
                pkgPath = _path.default.join(importPath, pkg, "wasm.js");
            } else {
                try { pkgPath = require.resolve(pkg); } catch (_) {}
            }
            if (false) {`;

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  console.log('✅ Patched loadWasm in next/dist/build/swc/index.js');
}

// 2. Allow NEXT_USE_WASM to force wasm fallback
const target2 = 'const shouldLoadWasmFallbackFirst = !disableWasmFallback && unsupportedPlatform && useWasmBinary || isWebContainer;';
const replacement2 = 'const shouldLoadWasmFallbackFirst = process.env.NEXT_USE_WASM === "1" || (!disableWasmFallback && unsupportedPlatform && useWasmBinary || isWebContainer);';

if (content.includes(target2)) {
  content = content.replace(target2, replacement2);
  console.log('✅ Patched shouldLoadWasmFallbackFirst in next/dist/build/swc/index.js');
}

fs.writeFileSync(swcIndexPath, content, 'utf8');
console.log('🎉 Next.js SWC patch applied successfully.');
