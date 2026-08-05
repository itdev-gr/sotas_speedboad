/**
 * Download free stock hero images (Unsplash + Pexels licenses).
 * Run: node scripts/download-blog-stock-images.mjs
 */
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/images');

/** @type {{ file: string, url: string, credit: string }[]} */
const ASSETS = [
	{
		file: 'blog-stock-marina-departure.jpeg',
		url: 'https://unsplash.com/photos/dbLyF0p1j9Q/download?force=true&w=1600',
		credit: 'Unsplash / marina at golden hour (Naxos, Greece)',
	},
	{
		file: 'blog-stock-zante-aerial.jpeg',
		url: 'https://unsplash.com/photos/p5Ed94-6AGk/download?force=true&w=1600',
		credit: 'Unsplash / Francesco Ungaro — Zakynthos aerial',
	},
	{
		file: 'blog-stock-zakynthos-drone.jpeg',
		url: 'https://images.pexels.com/photos/33252031/pexels-photo-33252031.jpeg?auto=compress&cs=tinysrgb&w=1600',
		credit: 'Pexels / Efrem Efre — Zakynthos aerial boat',
	},
	{
		file: 'blog-stock-yachts-zakynthos.jpeg',
		url: 'https://unsplash.com/photos/reu0eBUpZKQ/download?force=true&w=1600',
		credit: 'Unsplash — boats in Zakynthos waters',
	},
	{
		file: 'blog-stock-blue-caves.jpeg',
		url: 'https://unsplash.com/photos/F3rDBnQQbQU/download?force=true&w=1600',
		credit: 'Unsplash — Blue Caves, Zakynthos',
	},
	{
		file: 'blog-stock-natural-arch.jpeg',
		url: 'https://unsplash.com/photos/xd-w7rK5SVg/download?force=true&w=1600',
		credit: 'Unsplash / erika m — sea arch, Zakynthos',
	},
	{
		file: 'blog-stock-tourboats-caves.jpeg',
		url: 'https://images.pexels.com/photos/12569982/pexels-photo-12569982.jpeg?auto=compress&cs=tinysrgb&w=1600',
		credit: 'Pexels / Louis — tour boats near Zakynthos caves',
	},
	{
		file: 'blog-stock-sunset-silhouette.jpeg',
		url: 'https://unsplash.com/photos/neZ0ZThx6xI/download?force=true&w=1600',
		credit: 'Unsplash — Ionian sunset boat silhouette',
	},
	{
		file: 'blog-stock-greece-speedboat.jpeg',
		url: 'https://images.pexels.com/photos/37887235/pexels-photo-37887235.jpeg?auto=compress&cs=tinysrgb&w=1600',
		credit: 'Pexels / Margo Evardson — speedboat, Greece',
	},
	{
		file: 'blog-stock-calm-cloudy-sea.jpeg',
		url: 'https://unsplash.com/photos/4zeGk06dzwg/download?force=true&w=1600',
		credit: 'Unsplash / Anna Hunko — calm cloudy sea',
	},
	{
		file: 'blog-stock-calm-bay.jpeg',
		url: 'https://unsplash.com/photos/MDKqRlKSLk8/download?force=true&w=1600',
		credit: 'Unsplash / Jack Barton — calm bay, Greece',
	},
	{
		file: 'blog-stock-birds-eye-boat.jpeg',
		url: 'https://unsplash.com/photos/QI76OafqTiA/download?force=true&w=1600',
		credit: 'Unsplash — bird\'s eye boat at Navagio, Zakynthos',
	},
	{
		file: 'blog-stock-aerial-beach-boat.jpeg',
		url: 'https://unsplash.com/photos/DVMIcFoqDpI/download?force=true&w=1600',
		credit: 'Unsplash / Ana-Maria D. — aerial Navagio boat',
	},
];

async function download({ file, url }) {
	const dest = join(OUT, file);
	const res = await fetch(url, { redirect: 'follow' });
	if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
	await pipeline(res.body, createWriteStream(dest));
	console.log(`saved ${file}`);
}

await mkdir(OUT, { recursive: true });

for (const asset of ASSETS) {
	await download(asset);
}

const credits = ASSETS.map((a) => `- \`${a.file}\` — ${a.credit}`).join('\n');
await import('node:fs/promises').then(({ writeFile }) =>
	writeFile(
		join(OUT, 'blog-stock-credits.txt'),
		`Blog stock hero images (Unsplash License / Pexels License — free commercial use)\n\n${credits}\n`,
	),
);

console.log(`Downloaded ${ASSETS.length} stock images.`);
