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
		image: '/images/blog-stock-calm-cloudy-sea.jpeg',
		imageAlt: 'Calm sea under a cloudy sky — weather-aware boat planning in Greece',
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
		image: '/images/blog-stock-greece-speedboat.jpeg',
		imageAlt: 'Speedboat cruising the Greek coastline from a resort departure area',
	},
	'full-island-boat-tour-zakynthos': {
		image: '/images/unnamed-hero.webp',
		imageAlt: 'Navagio Shipwreck Beach and cliffs seen from above on a full-island boat route',
	},
	'hidden-beaches-zakynthos-by-boat': {
		image: '/images/blog-stock-natural-arch.jpeg',
		imageAlt: 'Natural sea arch and limestone coast reachable by boat in Zakynthos',
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
		image: '/images/blog-stock-zakynthos-drone.jpeg',
		imageAlt: 'Aerial view of a rental boat on clear Zakynthos water',
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
		image: '/images/blog-stock-birds-eye-boat.jpeg',
		imageAlt: 'Bird\'s-eye view of a small rental boat on calm Zakynthos water',
	},
	'seasickness-boat-trip-zakynthos': {
		image: '/images/blog-stock-calm-bay.jpeg',
		imageAlt: 'Calm inshore water and settled conditions for sensitive passengers',
	},
	'self-drive-or-skipper-boat-rental-zakynthos': {
		image: '/images/blog-stock-yachts-zakynthos.jpeg',
		imageAlt: 'Boats moored in clear Zakynthos water — self-drive or skippered formats',
	},
	'snorkeling-by-boat-zakynthos': {
		image: '/images/blog-stock-blue-caves.jpeg',
		imageAlt: 'Blue Caves coastline and clear water for snorkelling by boat in Zakynthos',
	},
	'sunset-boat-tour-zakynthos': {
		image: '/images/blog-stock-sunset-silhouette.jpeg',
		imageAlt: 'Boat silhouette on the Ionian Sea at sunset',
	},
	'turtle-island-keri-caves-mizithres-rocks-boat-zakynthos': {
		image: '/images/IMG_6507.webp',
		imageAlt: 'Sea caves and limestone cliffs on the south coast of Zakynthos',
	},
	'what-to-bring-zakynthos-boat-trip': {
		image: '/images/blog-stock-aerial-beach-boat.jpeg',
		imageAlt: 'Aerial view of a boat day at a Zakynthos beach stop',
	},
	'where-to-rent-boat-zakynthos-departure-guide': {
		image: '/images/blog-stock-marina-departure.jpeg',
		imageAlt: 'Boats at a Greek marina — planning your Zakynthos departure point',
	},
	'zakynthos-boat-rental-prices-cost-guide': {
		image: '/images/blog-stock-zante-aerial.jpeg',
		imageAlt: 'Aerial view of a boat on turquoise Zakynthos water',
	},
	'zakynthos-marine-park-boat-rules': {
		image: '/images/blog-stock-tourboats-caves.jpeg',
		imageAlt: 'Tour boats near Zakynthos cliffs in an area governed by marine park rules',
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
