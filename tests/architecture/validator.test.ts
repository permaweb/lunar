import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const temporaryProjects: string[] = [];
const validator = resolve(
	process.cwd(),
	'.agents/skills/permaweb-frontend-code-style/scripts/validate_frontend_architecture.mjs'
);

function createFixture(source: string, sourceFile = 'example.ts') {
	const project = mkdtempSync(join(tmpdir(), 'lunar-architecture-'));
	temporaryProjects.push(project);
	mkdirSync(join(project, 'src'), { recursive: true });
	mkdirSync(join(project, 'tests'), { recursive: true });
	writeFileSync(
		join(project, '.permaweb-frontend.json'),
		JSON.stringify({ status: 'adopting', sourceRoot: 'src', testRoot: 'tests' })
	);
	writeFileSync(join(project, 'src', sourceFile), source);
	return project;
}

afterEach(() => {
	for (const project of temporaryProjects.splice(0)) rmSync(project, { recursive: true, force: true });
});

describe('frontend architecture validator', () => {
	it('rejects remote requests outside the API boundary', () => {
		const project = createFixture(`export function load() { return fetch('/data'); }`);
		const result = spawnSync(process.execPath, [validator, '--root', project], { encoding: 'utf8' });

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('[api-boundary] src/example.ts');
	});

	it('allows local pixel dimensions while keeping raw colors behind design tokens', () => {
		const dimensionsProject = createFixture(`export const styles = 'padding: 12px';`, 'styles.ts');
		const dimensionsResult = spawnSync(process.execPath, [validator, '--root', dimensionsProject], {
			encoding: 'utf8',
		});

		expect(dimensionsResult.status).toBe(0);

		const colorsProject = createFixture(`export const styles = 'color: #fff';`, 'styles.ts');
		const colorsResult = spawnSync(process.execPath, [validator, '--root', colorsProject], { encoding: 'utf8' });

		expect(colorsResult.status).toBe(1);
		expect(colorsResult.stderr).toContain('[design-token] src/styles.ts');
	});
});
