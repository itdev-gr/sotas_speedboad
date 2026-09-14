import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jobs = [
	['private-boat-8-12-people-zakynthos', ['it', 'ru', 'el']],
	['private-boat-tour-couples-zakynthos', ['it', 'ru', 'el']],
	['seasickness-boat-trip-zakynthos', ['it', 'ru', 'el']],
	['snorkeling-by-boat-zakynthos', ['it', 'ru', 'el']],
	['4-hour-vs-7-hour-boat-rental-zakynthos', ['ru', 'el']],
	['best-month-rent-boat-zakynthos', ['ru', 'el']],
	['boat-trip-from-laganas-tsilivi-argassi-alykes-zakynthos', ['ru', 'el']],
	['zakynthos-cruise-port-private-boat-trip', ['de', 'fr', 'it', 'ru', 'el']],
	['cameo-island-or-marathonisi-by-boat-zakynthos', ['de', 'fr', 'it', 'ru', 'el']],
];

function runJob(slug, locale) {
	return new Promise((resolve, reject) => {
		const child = spawn(
			process.execPath,
			[
				path.join(root, 'scripts/translate-blog.mjs'),
				'--missing-only',
				'--continue-on-error',
				`--slug=${slug}`,
				`--locale=${locale}`,
			],
			{ cwd: root, stdio: 'inherit' },
		);
		child.on('exit', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`${slug}/${locale} exited ${code}`));
		});
	});
}

for (const [slug, locales] of jobs) {
	for (const locale of locales) {
		console.log(`\n=== ${locale}/${slug} ===`);
		try {
			await runJob(slug, locale);
		} catch (error) {
			console.error(String(error));
		}
	}
}

console.log('\nBatch complete.');
