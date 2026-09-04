import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

import { parse } from 'acorn';

const DASHBOARD_URL = 'https://391283911206kb.arweave.net/';
const DASHBOARD_SHA256 = '834ec59aae86439244c28a16efd5e277c8a92c8ddaa391ee87f7284b77a5e565';
const DECLARATIONS = new Set(['$', 'gr', 'mI', 'yI', 'Xn']);
const HEADER = `/**
 * Unmodified compiled lmdb-wasm reader from the user-supplied AR LMDB dashboard.
 * Only the ES module export facade below was added. See UPSTREAM.md and licenses/.
 */
`;
const FOOTER = '\nXn();\nexport { We as LmdbEnv, $n as LmdbDb, RI as LmdbCursor, Wn as LmdbError, uA as CursorOp };\n';

const response = await fetch(DASHBOARD_URL, { signal: AbortSignal.timeout(30_000) });
if (!response.ok) throw new Error(`Dashboard request failed: ${response.status}`);
const html = await response.text();
if (createHash('sha256').update(html).digest('hex') !== DASHBOARD_SHA256) {
	throw new Error('Dashboard content no longer matches the pinned SHA-256');
}

const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].at(-1)?.[1];
if (!script) throw new Error('Dashboard has no inline script');
const document = parse(script, { ecmaVersion: 'latest', sourceType: 'module' });
const declarations = document.body.filter((statement) => {
	const names =
		statement.type === 'VariableDeclaration'
			? statement.declarations.map((declaration) => declaration.id.name)
			: [statement.id?.name];
	return names.some((name) => DECLARATIONS.has(name));
});
if (declarations.length !== DECLARATIONS.size) throw new Error('Unexpected LMDB module shape');
const expected = HEADER + declarations.map((statement) => script.slice(statement.start, statement.end)).join('\n') + FOOTER;
const actual = await readFile(new URL('./index.js', import.meta.url), 'utf8');
if (actual !== expected) throw new Error('Vendored LMDB runtime differs from the pinned dashboard');
console.log('Vendored LMDB runtime matches the pinned dashboard exactly.');
