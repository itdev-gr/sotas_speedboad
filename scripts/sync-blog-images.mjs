/**
 * Sync blog hero images from mapping (EN source + all blog-i18n locales).
 * Run: node scripts/sync-blog-images.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** @type {Record<string, { image: string, imageAlt: string }>} */
const IMAGE_MAP = {
	'bad-weather-boat-rental-zakynthos': {
		image: '/images/hero2.webp',
		imageAlt: 'Calm turquoise water and rocky Zakynthos coastline on a settled day',
	},
	'best-family-boat-route-zakynthos': {
		image: '/images/IMG_6566.webp',
		imageAlt: 'Boat in sheltered turquoise water on a calm family-friendly south-coast route',
	},
	'best-month-rent-boat-zakynthos': {
		image: '/images/IMG_6416.webp',
		imageAlt: 'Private rental speedboat on deep blue water off the Zakynthos coast',
	},
	'boat-trip-from-laganas-tsilivi-argassi-alykes-zakynthos': {
		image: '/images/skipper-drive.webp',
		imageAlt: 'Self-drive boat heading out from a Zakynthos resort area',
	},
	'full-island-boat-tour-zakynthos': {
		image: '/images/unnamed-hero.webp',
		imageAlt: 'Navagio Shipwreck Beach and cliffs seen from above on a full-island boat route',
	},
	'hidden-beaches-zakynthos-by-boat': {
		image: '/images/girlinwoater.webp',
		imageAlt: 'Boat approaching a hidden limestone cave arch on the Zakynthos coast',
	},
	'morning-or-afternoon-boat-rental-zakynthos': {
		image: '/images/unnamed.webp',
		imageAlt: 'Navagio Bay in bright daylight, a common morning boat destination',
	},
	'navagio-shipwreck-beach-blue-caves-boat-zakynthos': {
		image: '/images/license-free-hero.webp',
		imageAlt: 'Rental boats anchored at Navagio Shipwreck Beach in Zakynthos',
	},
	'no-license-boat-rental-zakynthos': {
		image: '/images/self-drive-boat.webp',
		imageAlt: 'Self-drive license-free speedboat on clear Zakynthos water',
	},
	'private-boat-8-12-people-zakynthos': {
		image: '/images/fleet-experience.webp',
		imageAlt: 'Guests relaxing on the sun deck during a private Zakynthos boat day',
	},
	'private-boat-cruise-with-skipper-zakynthos': {
		image: '/images/image_skipper.webp',
		imageAlt: 'Private boat with guests enjoying a cave stop on the Zakynthos coast',
	},
	'private-boat-tour-couples-zakynthos': {
		image: '/images/IMG_0112.webp',
		imageAlt: 'Private boat in turquoise water inside a Zakynthos sea cave',
	},
	'private-cruise-vs-group-boat-tour-zakynthos': {
		image: '/images/IMG_0111.webp',
		imageAlt: 'Private boat approaching Navagio Beach away from crowded excursion traffic',
	},
	'private-yacht-cruise-zakynthos-special-celebrations': {
		image: '/images/0DF67F7B-8AA7-476C-BCEB-37E088D4925A.webp',
		imageAlt: 'Private celebration cruise at sunset off the Zakynthos coast',
	},
	'safe-rent-boat-zakynthos-without-experience': {
		image: '/images/IMG_6507.webp',
		imageAlt: 'Calm cave coastline and easy water conditions for first-time renters',
	},
	'seasickness-boat-trip-zakynthos': {
		image: '/images/hero2.png',
		imageAlt: 'Sheltered rocky coastline and calm inshore water in Zakynthos',
	},
	'self-drive-or-skipper-boat-rental-zakynthos': {
		image: '/images/license-free-hero.webp',
		imageAlt: 'Fleet of self-drive rental boats at Navagio Beach in Zakynthos',
	},
	'snorkeling-by-boat-zakynthos': {
		image: '/images/girlinwoater.webp',
		imageAlt: 'Boat bow above clear turquoise snorkelling water in Zakynthos',
	},
	'sunset-boat-tour-zakynthos': {
		image: '/images/hero2.png',
		imageAlt: 'Rocky Zakynthos coastline in warm late-afternoon light',
	},
	'turtle-island-keri-caves-mizithres-rocks-boat-zakynthos': {
		image: '/images/IMG_6507.webp',
		imageAlt: 'Sea caves and limestone cliffs on the south coast of Zakynthos',
	},
	'what-to-bring-zakynthos-boat-trip': {
		image: '/images/image_skipper.webp',
		imageAlt: 'Guests on a private boat preparing for a day on the Zakynthos water',
	},
	'where-to-rent-boat-zakynthos-departure-guide': {
		image: '/images/IMG_6416.webp',
		imageAlt: 'Rental speedboat on open water leaving from a Zakynthos departure point',
	},
	'zakynthos-boat-rental-prices-cost-guide': {
		image: '/images/self-drive-boat.webp',
		imageAlt: 'Self-drive rental boat on the water, a common Zakynthos hire format',
	},
	'zakynthos-marine-park-boat-rules': {
		image: '/images/skipper-drive.webp',
		imageAlt: 'Boat under way in Zakynthos waters governed by marine park rules',
	},
};

function patchFile(filePath, { image, imageAlt }) {
	let content = readFileSync(filePath, 'utf8');
	if (!content.startsWith('---')) return false;

	const end = content.indexOf('---', 3);
	if (end === -1) return false;

	const front = content.slice(0, end + 3);
	const body = content.slice(end + 3);

	let next = front.replace(/^image: .*$/m, `image: "${image}"`);
	if (/^imageAlt: /m.test(next)) {
		next = next.replace(/^imageAlt: .*$/m, `imageAlt: "${imageAlt}"`);
	} else {
		next = next.replace(/^(image: .*?\n)/m, `$1imageAlt: "${imageAlt}"\n`);
	}

	writeFileSync(filePath, next + body);
	return true;
}

let updated = 0;

for (const slug of Object.keys(IMAGE_MAP)) {
	const enPath = join(ROOT, 'src/content/blog', `${slug}.md`);
	if (patchFile(enPath, IMAGE_MAP[slug])) updated++;
}

for (const locale of readdirSync(join(ROOT, 'src/content/blog-i18n'))) {
	const localeDir = join(ROOT, 'src/content/blog-i18n', locale);
	if (!statSync(localeDir).isDirectory()) continue;
	for (const file of readdirSync(localeDir)) {
		if (!file.endsWith('.md')) continue;
		const slug = file.replace(/\.md$/, '');
		if (!IMAGE_MAP[slug]) continue;
		if (patchFile(join(localeDir, file), IMAGE_MAP[slug])) updated++;
	}
}

console.log(`Updated ${updated} blog files with image assignments.`);
