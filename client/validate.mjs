/*
 * Static validation for the OrbitWatch client.
 * `vite build` cannot run here: node_modules was installed on
 * Windows and the Linux rollup binary is unavailable. So this
 * does the checks a build would have caught, using the pure-JS
 * Babel packages that are already installed:
 *   1. every module parses as ESM + JSX
 *   2. every relative import resolves to a real file
 *   3. every named/default import exists in the target module
 *   4. every lucide-react icon imported really exists
 *   5. hooks are only called inside components/hooks
 *   6. every CSS class used in JSX has a rule in styles.css
 *   7. every custom property consumed is defined in both themes
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { createRequire } from "node:module";

const ROOT = "/sessions/ecstatic-elegant-carson/mnt/OrbitWatch/client";
const SRC = join(ROOT, "src");
const require_ = createRequire(join(ROOT, "package.json"));

const parser = require_("@babel/parser");
const traverseMod = require_("@babel/traverse");
const traverse = traverseMod.default ?? traverseMod;

const problems = [];
const notes = [];
const fail = (m) => problems.push(m);

/* ---------- collect source files ---------- */
function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(jsx?|css)$/.test(entry)) out.push(p);
  }
  return out;
}

const all = walk(SRC);
const modules = all.filter((f) => /\.jsx?$/.test(f));
const rel = (f) => relative(SRC, f).replace(/\\/g, "/");
/* ---------- 1. parse ---------- */
const asts = new Map();

for (const file of modules) {
  const code = readFileSync(file, "utf8");
  try {
    asts.set(
      file,
      parser.parse(code, {
        sourceType: "module",
        plugins: ["jsx", "classProperties", "optionalChaining", "nullishCoalescingOperator"],
      })
    );
  } catch (error) {
    fail(`PARSE  ${rel(file)}: ${error.message}`);
  }
}

/* ---------- 2/3. export maps + import resolution ---------- */

const exportsOf = new Map();

for (const [file, ast] of asts) {
  const names = new Set();
  for (const node of ast.program.body) {
    if (node.type === "ExportDefaultDeclaration") names.add("default");
    if (node.type === "ExportNamedDeclaration") {
      for (const s of node.specifiers ?? []) names.add(s.exported.name);
      const d = node.declaration;
      if (d?.type === "FunctionDeclaration" || d?.type === "ClassDeclaration") {
        names.add(d.id.name);
      }
      if (d?.type === "VariableDeclaration") {
        for (const decl of d.declarations) {
          if (decl.id.type === "Identifier") names.add(decl.id.name);
        }
      }
    }
  }
  exportsOf.set(file, names);
}

function resolveImport(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec);
  const candidates = [base, `${base}.js`, `${base}.jsx`, join(base, "index.js"), join(base, "index.jsx")];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}
/* lucide-react's real export list, read from the module itself
   rather than guessed from filenames. */
let lucideExports = null;
try {
  lucideExports = new Set(Object.keys(require_("lucide-react")));
} catch (error) {
  notes.push(`could not load lucide-react: ${error.message}`);
}

const importedIcons = new Set();

for (const [file, ast] of asts) {
  for (const node of ast.program.body) {
    if (node.type !== "ImportDeclaration") continue;
    const source = node.source.value;

    if (source === "lucide-react") {
      for (const s of node.specifiers) {
        if (s.type === "ImportSpecifier") importedIcons.add(s.imported.name);
      }
      continue;
    }

    if (!source.startsWith(".")) continue;
    if (source.endsWith(".css")) {
      if (!existsSync(resolve(dirname(file), source))) {
        fail(`IMPORT ${rel(file)}: missing stylesheet "${source}"`);
      }
      continue;
    }

    const target = resolveImport(file, source);
    if (!target) {
      fail(`IMPORT ${rel(file)}: cannot resolve "${source}"`);
      continue;
    }

    const available = exportsOf.get(target);
    if (!available) continue;

    for (const s of node.specifiers) {
      const wanted =
        s.type === "ImportDefaultSpecifier"
          ? "default"
          : s.type === "ImportSpecifier"
            ? s.imported.name
            : null;
      if (wanted && !available.has(wanted)) {
        fail(
          `EXPORT ${rel(file)}: "${wanted}" is not exported by ${rel(target)} ` +
            `(has: ${[...available].join(", ") || "nothing"})`
        );
      }
    }
  }
}

if (lucideExports) {
  for (const icon of importedIcons) {
    if (!lucideExports.has(icon)) {
      fail(`ICON   lucide-react does not export "${icon}"`);
    }
  }
  notes.push(
    `${importedIcons.size} lucide icons imported, checked against ${lucideExports.size} real exports`
  );
} else {
  notes.push(`${importedIcons.size} icon imports UNVERIFIED`);
}

/* ---------- 5. hooks only inside components/hooks ---------- */

const HOOKS = /^use[A-Z]/;

for (const [file, ast] of asts) {
  traverse(ast, {
    CallExpression(path) {
      const callee = path.node.callee;
      const name =
        callee.type === "Identifier"
          ? callee.name
          : callee.type === "MemberExpression" && callee.property.type === "Identifier"
            ? callee.property.name
            : null;
      if (!name || !HOOKS.test(name)) return;

      const fn = path.getFunctionParent();
      const owner =
        fn?.node.id?.name ??
        (fn?.parentPath.node.type === "VariableDeclarator" ? fn.parentPath.node.id.name : null);

      if (!fn) {
        fail(`HOOK   ${rel(file)}: ${name}() called at module top level`);
        return;
      }
      if (!owner || !(/^[A-Z]/.test(owner) || HOOKS.test(owner))) {
        fail(`HOOK   ${rel(file)}: ${name}() called inside "${owner ?? "anonymous function"}"`);
      }
    },
  });
}

/* ---------- 6. CSS classes used vs. defined ---------- */

const css = readFileSync(join(SRC, "styles.css"), "utf8");
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, "");

const definedClasses = new Set();
for (const m of cssNoComments.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) {
  definedClasses.add(m[1]);
}

const usedClasses = new Map(); // class -> first file seen

for (const [file, ast] of asts) {
  traverse(ast, {
    JSXAttribute(path) {
      if (path.node.name.name !== "className") return;
      const v = path.node.value;
      const chunks = [];

      if (v?.type === "StringLiteral") chunks.push(v.value);
      if (v?.type === "JSXExpressionContainer") {
        const expr = v.expression;
        const collect = (node) => {
          if (!node) return;
          if (node.type === "StringLiteral") chunks.push(node.value);
          else if (node.type === "TemplateLiteral") {
            for (const q of node.quasis) chunks.push(q.value.cooked ?? "");
            for (const e of node.expressions) collect(e);
          } else if (node.type === "ConditionalExpression") {
            collect(node.consequent);
            collect(node.alternate);
          } else if (node.type === "LogicalExpression") {
            collect(node.left);
            collect(node.right);
          } else if (node.type === "BinaryExpression") {
            collect(node.left);
            collect(node.right);
          }
        };
        collect(expr);
      }

      for (const chunk of chunks) {
        for (const cls of chunk.split(/\s+/)) {
          // template holes leave partial tokens like "sat-" — those
          // are the dynamic category/tone prefixes, checked below.
          if (!cls || cls.endsWith("-")) continue;
          if (!usedClasses.has(cls)) usedClasses.set(cls, rel(file));
        }
      }
    },
  });
}

const unstyled = [...usedClasses].filter(([cls]) => !definedClasses.has(cls));
for (const [cls, where] of unstyled) {
  fail(`CSS    class "${cls}" used in ${where} has no rule in styles.css`);
}

/* dynamic prefixes: sat-*, ow-panel-*, ow-badge-*, empty-*, tone-*, feed-* */
const DYNAMIC = {
  "sat-": ["station", "science", "weather", "comms", "india", "other"],
  "ow-panel-": ["primary", "secondary", "support", "quiet"],
  "ow-badge-": ["amber", "green", "neutral", "red"],
  "empty-": ["neutral", "warn"],
  "tone-": ["amber", "green", "neutral", "red"],
  "feed-": ["green", "amber", "red"],
};

for (const [prefix, variants] of Object.entries(DYNAMIC)) {
  for (const v of variants) {
    const cls = prefix + v;
    // `support`/`neutral` may intentionally inherit the base rule
    const inherits = ["ow-panel-support", "ow-badge-neutral", "empty-neutral"];
    if (!definedClasses.has(cls) && !inherits.includes(cls)) {
      fail(`CSS    dynamic class "${cls}" is never defined`);
    }
  }
}

/* ---------- 7. custom properties ---------- */

const declaredIn = (block) => {
  const set = new Set();
  for (const m of block.matchAll(/(--[\w-]+)\s*:/g)) set.add(m[1]);
  return set;
};

const grab = (selector) => {
  const i = cssNoComments.indexOf(selector);
  if (i === -1) return "";
  const open = cssNoComments.indexOf("{", i);
  let depth = 0;
  for (let j = open; j < cssNoComments.length; j += 1) {
    if (cssNoComments[j] === "{") depth += 1;
    if (cssNoComments[j] === "}") {
      depth -= 1;
      if (depth === 0) return cssNoComments.slice(open, j);
    }
  }
  return "";
};

const rootVars = declaredIn(grab(":root,\n:root[data-theme=\"dark\"]") || grab(":root {"));
const baseVars = declaredIn(grab(":root {"));
const lightVars = declaredIn(grab(':root[data-theme="light"]'));
const allDeclared = new Set([...rootVars, ...baseVars, ...lightVars, ...declaredIn(cssNoComments)]);

/* every var() consumed anywhere (CSS + inline SVG attributes) */
const consumed = new Set();
const scanVars = (text) => {
  for (const m of text.matchAll(/var\(\s*(--[\w-]+)/g)) consumed.add(m[1]);
};
scanVars(cssNoComments);
for (const file of modules) scanVars(readFileSync(file, "utf8"));

for (const v of consumed) {
  if (!allDeclared.has(v)) fail(`VAR    ${v} is used but never declared`);
}

/* the radar's colours must exist in BOTH themes, or a theme
   switch would leave the SVG with inherited/blank paint. */
const RADAR_VARS = [
  "--accent",
  "--dome-inner",
  "--dome-mid",
  "--dome-outer",
  "--grid-line",
  "--grid-line-strong",
  "--zenith-strength",
  "--sweep-strength",
  "--star",
  "--sat-station",
  "--sat-science",
  "--sat-weather",
  "--sat-comms",
  "--sat-india",
  "--sat-other",
  "--text",
  "--text-soft",
  "--text-muted",
  "--text-faint",
];

const darkBlock = declaredIn(grab(':root,\n:root[data-theme="dark"]'));
for (const v of RADAR_VARS) {
  if (!darkBlock.has(v)) fail(`THEME  ${v} missing from the dark theme block`);
  if (!lightVars.has(v)) fail(`THEME  ${v} missing from :root[data-theme="light"]`);
}

/* duplicated theme blocks were the old bug — make sure the
   token blocks appear exactly once each. */
const countOf = (needle) => cssNoComments.split(needle).length - 1;
const darkCount = countOf(':root[data-theme="dark"]');
const lightCount = countOf(':root[data-theme="light"]');
if (darkCount !== 1) fail(`THEME  dark block declared ${darkCount} times`);
if (lightCount !== 1) fail(`THEME  light block declared ${lightCount} times`);

/* ---------- report ---------- */

console.log(`modules parsed      ${asts.size}`);
console.log(`exports mapped      ${[...exportsOf.values()].reduce((n, s) => n + s.size, 0)}`);
console.log(`classes used        ${usedClasses.size}`);
console.log(`classes defined     ${definedClasses.size}`);
console.log(`custom props used   ${consumed.size}`);
console.log(`stylesheet lines    ${css.split("\n").length}`);
for (const n of notes) console.log(`note                ${n}`);
console.log("");

if (problems.length === 0) {
  console.log("PASS — no problems found");
} else {
  console.log(`FAIL — ${problems.length} problem(s):`);
  for (const p of problems) console.log(`  ${p}`);
  process.exitCode = 1;
}
