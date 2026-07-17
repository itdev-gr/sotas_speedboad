import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { translate } from '@vitalets/google-translate-api';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'src/content/blog');
const outRoot = path.join(root, 'src/content/blog-i18n');
const targetLocales = ['de', 'fr', 'it', 'ru', 'el'];

const localeTargets = {
	de: 'de',
	fr: 'fr',
	it: 'it',
	ru: 'ru',
	el: 'el',
};

const INTERNAL_PATHS = [
	'/contact',
	'/faq',
	'/tours',
	'/license-free-rent',
	'/rent-with-skipper',
	'/private-yachting',
	'/special-celebrations',
	'/recommended-routes',
	'/navagio-shipwreck-boat-tour',
	'/blue-caves-boat-tour',
	'/keri-caves-turtle-island-boat-tour',
	'/sunset-boat-tour',
	'/blog',
];

function hashSource(raw) {
	return createHash('sha256').update(raw).digest('hex');
}

function parseFrontmatter(raw) {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
	if (!match) throw new Error('Invalid markdown frontmatter');
	return { frontmatter: match[1], body: match[2] };
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

function setField(frontmatter, key, value) {
	const escaped = JSON.stringify(value).slice(1, -1);
	const line = `${key}: "${escaped}"`;
	if (new RegExp(`^${key}:`, 'm').test(frontmatter)) {
		return frontmatter.replace(new RegExp(`^${key}:.*$`, 'm'), line);
	}
	return `${frontmatter.trim()}\n${line}`;
}

function localizeLinks(markdown, locale) {
	let out = markdown;
	for (const internalPath of INTERNAL_PATHS) {
		const localized = internalPath === '/blog' ? `/${locale}/blog` : `/${locale}${internalPath}`;
		out = out.replaceAll(`](${internalPath})`, `](${localized})`);
		out = out.replaceAll(`](${internalPath}/)`, `](${localized})`);
	}
	return out;
}

async function translateText(text, target) {
	if (!text.trim()) return text;
	const chunks = splitText(text, 4500);
	const translated = [];
	for (const chunk of chunks) {
		let lastError;
		for (let attempt = 0; attempt < 5; attempt += 1) {
			try {
				const result = await translate(chunk, { to: target });
				translated.push(result.text);
				lastError = undefined;
				break;
			} catch (error) {
				lastError = error;
				await sleep(1000 * (attempt + 1));
			}
		}
		if (lastError) throw lastError;
		await sleep(500);
	}
	return translated.join('');
}

function splitText(text, maxLen) {
	const parts = [];
	let current = '';
	for (const paragraph of text.split(/(\n\n+)/)) {
		if ((current + paragraph).length > maxLen && current) {
			parts.push(current);
			current = paragraph;
		} else {
			current += paragraph;
		}
	}
	if (current) parts.push(current);
	return parts;
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translatePost(fileName, locale) {
	const sourcePath = path.join(sourceDir, fileName);
	const raw = await readFile(sourcePath, 'utf8');
	const { frontmatter, body } = parseFrontmatter(raw);
	const slug = fileName.replace(/\.md$/, '');
	const sourceHash = hashSource(raw);
	const outDir = path.join(outRoot, locale);
	const outPath = path.join(outDir, fileName);

	try {
		const existing = await readFile(outPath, 'utf8');
		const existingHash = getField(parseFrontmatter(existing).frontmatter, 'sourceHash');
		if (existingHash === sourceHash) {
			console.log(`skip ${locale}/${slug}`);
			return;
		}
	} catch {
		// generate fresh
	}

	const target = localeTargets[locale];
	let nextFrontmatter = frontmatter;
	for (const field of ['title', 'metaTitle', 'metaDescription', 'excerpt', 'imageAlt']) {
		const value = getField(frontmatter, field);
		if (value) nextFrontmatter = setField(nextFrontmatter, field, await translateText(value, target));
	}

	const translatedBody = localizeLinks(await translateText(body, target), locale);
	const output = `---\n${nextFrontmatter.trim()}\nlocale: "${locale}"\nsourceSlug: "${slug}"\nsourceHash: "${sourceHash}"\ntranslatedAt: "${new Date().toISOString().slice(0, 10)}"\n---\n\n${translatedBody.trim()}\n`;

	await mkdir(outDir, { recursive: true });
	await writeFile(outPath, output, 'utf8');
	console.log(`wrote ${locale}/${slug}`);
}

const onlyLocale = process.argv.find((arg) => arg.startsWith('--locale='))?.split('=')[1];
const locales = onlyLocale ? [onlyLocale] : targetLocales;
const files = (await readdir(sourceDir)).filter((file) => file.endsWith('.md'));

for (const locale of locales) {
	for (const file of files) {
		await translatePost(file, locale);
	}
}
