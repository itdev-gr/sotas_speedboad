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
	// Localize English blog post deep links: /blog/slug -> /{locale}/blog/slug
	out = out.replaceAll('](/blog/', `](/${locale}/blog/`);
	return out;
}

function protectMarkdownUrls(text) {
	const urls = [];
	const protectedText = text.replace(/\]\(([^)]+)\)/g, (_, url) => {
		const index = urls.length;
		urls.push(url);
		return `]({{URL${index}}})`;
	});
	return { protectedText, urls };
}

function restoreMarkdownUrls(text, urls) {
	let out = text;
	for (let i = 0; i < urls.length; i += 1) {
		out = out.replaceAll(`]({{URL${i}}})`, `](${urls[i]})`);
		// Google sometimes inserts spaces around placeholders
		out = out.replaceAll(`] ({{URL${i}}})`, `](${urls[i]})`);
		out = out.replaceAll(`]({{ URL${i} }})`, `](${urls[i]})`);
	}
	return out;
}

async function translateText(text, target) {
	if (!text.trim()) return text;
	const { protectedText, urls } = protectMarkdownUrls(text);
	const chunks = splitText(protectedText, 4500);
	const translated = [];
	for (const chunk of chunks) {
		let lastError;
		for (let attempt = 0; attempt < 8; attempt += 1) {
			try {
				const result = await translate(chunk, { to: target });
				translated.push(result.text);
				lastError = undefined;
				break;
			} catch (error) {
				lastError = error;
				const message = String(error?.message ?? error);
				const retryAfter = message.includes('Too Many Requests') ? 20000 * (attempt + 1) : 2000 * (attempt + 1);
				await sleep(retryAfter);
			}
		}
		if (lastError) throw lastError;
		await sleep(2500);
	}
	return restoreMarkdownUrls(translated.join(''), urls);
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

async function translatePost(fileName, locale, options) {
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
			return { status: 'skipped' };
		}
		if (options.missingOnly) {
			console.log(`skip stale ${locale}/${slug} (--missing-only)`);
			return { status: 'skipped' };
		}
	} catch {
		// missing file — translate below
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
	return { status: 'written' };
}

const onlyLocale = process.argv.find((arg) => arg.startsWith('--locale='))?.split('=')[1];
const onlySlug = process.argv.find((arg) => arg.startsWith('--slug='))?.split('=')[1];
const missingOnly = process.argv.includes('--missing-only');
const continueOnError = process.argv.includes('--continue-on-error');
const locales = onlyLocale ? [onlyLocale] : targetLocales;
let files = (await readdir(sourceDir)).filter((file) => file.endsWith('.md'));
if (onlySlug) files = files.filter((file) => file.replace(/\.md$/, '') === onlySlug);

let failures = 0;
for (const locale of locales) {
	for (const file of files) {
		try {
			await translatePost(file, locale, { missingOnly });
		} catch (error) {
			failures += 1;
			console.error(`failed ${locale}/${file.replace(/\.md$/, '')}: ${error?.message ?? error}`);
			if (!continueOnError) throw error;
		}
	}
}

if (failures > 0) {
	console.error(`Blog translation finished with ${failures} failure(s). Untranslated posts still work via English fallback routes.`);
	process.exit(continueOnError ? 0 : 1);
}
