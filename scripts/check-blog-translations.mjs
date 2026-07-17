import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'src/content/blog');
const outRoot = path.join(root, 'src/content/blog-i18n');
const targetLocales = ['de', 'fr', 'it', 'ru', 'el'];

function hashSource(raw) {
	return createHash('sha256').update(raw).digest('hex');
}

function parseFrontmatter(raw) {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) throw new Error('Invalid markdown frontmatter');
	return match[1];
}

function getField(frontmatter, key) {
	const m = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
	if (!m) return undefined;
	let value = m[1].trim();
	if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
		value = value.slice(1, -1);
	}
	return value;
}

const files = (await readdir(sourceDir)).filter((file) => file.endsWith('.md'));
let missing = 0;
let stale = 0;

for (const file of files) {
	const raw = await readFile(path.join(sourceDir, file), 'utf8');
	const sourceHash = hashSource(raw);
	for (const locale of targetLocales) {
		const outPath = path.join(outRoot, locale, file);
		try {
			const translated = await readFile(outPath, 'utf8');
			const fm = parseFrontmatter(translated);
			const translatedHash = getField(fm, 'sourceHash');
			if (translatedHash !== sourceHash) stale += 1;
		} catch {
			missing += 1;
		}
	}
}

if (missing || stale) {
	console.error(`Blog translation check failed: ${missing} missing, ${stale} stale`);
	process.exit(1);
}

console.log(`Blog translations OK for ${files.length} posts x ${targetLocales.length} locales`);
