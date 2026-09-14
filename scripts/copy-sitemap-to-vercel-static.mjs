import { copyFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const clientDir = path.join(root, 'dist', 'client');
const staticDir = path.join(root, '.vercel', 'output', 'static');

async function exists(filePath) {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

if (!(await exists(staticDir))) {
	console.log('skip sitemap copy: .vercel/output/static not found');
	process.exit(0);
}

for (const name of ['sitemap-index.xml', 'sitemap-0.xml']) {
	const src = path.join(clientDir, name);
	if (!(await exists(src))) continue;
	await copyFile(src, path.join(staticDir, name));
	console.log(`copied ${name} -> .vercel/output/static/`);
}
