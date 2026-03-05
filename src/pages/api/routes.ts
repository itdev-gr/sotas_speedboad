import type { APIRoute } from 'astro';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getDb } from '../../lib/firebase-admin';
import { verifySession } from '../../lib/auth';

export const prerender = false;

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

function toRouteDoc(d: QueryDocumentSnapshot) {
	const data = d.data();
	if (!data) return null;
	return {
		id: d.id,
		name: String(data.name ?? ''),
		duration: String(data.duration ?? ''),
		image: String(data.image ?? ''),
		description: String(data.description ?? ''),
		highlights: Array.isArray(data.highlights) ? data.highlights.map(String) : [],
		sortOrder: Number(data.sortOrder) ?? 0,
	};
}

const SEED_ROUTES = [
	{
		id: 'route_navagio',
		name: 'Navagio (Shipwreck) Beach',
		duration: '4–7 hours',
		image: '/images/unnamed.jpg',
		description: 'Visit the world-famous Shipwreck Beach — accessible only by sea. Crystal-clear turquoise waters and towering white cliffs make this the must-see destination in Zakynthos.',
		highlights: ['Iconic shipwreck on white sand', 'Turquoise waters perfect for swimming', 'Dramatic cliff scenery', 'Photo opportunities from the sea'],
		sortOrder: 1,
	},
	{
		id: 'route_blue_caves',
		name: 'Blue Caves',
		duration: '4–7 hours',
		image: '/images/IMG_6416.jpeg',
		description: 'Explore the magical Blue Caves at the northern tip of Zakynthos. Sunlight reflects off the white limestone and the sandy seabed, creating an incredible blue glow inside the caves.',
		highlights: ['Natural blue light reflections', 'Swim inside the caves', 'Stunning rock formations', 'Great for snorkeling'],
		sortOrder: 2,
	},
	{
		id: 'route_turtle_island',
		name: 'Marathonisi (Turtle Island)',
		duration: '4 hours',
		image: '/images/self-drive-boat.png',
		description: 'Cruise to Turtle Island in Laganas Bay — a protected nesting site for the Caretta Caretta sea turtle. Enjoy the pristine sandy beach and spot turtles in their natural habitat.',
		highlights: ['Caretta Caretta turtle spotting', 'Unspoiled sandy beach', 'Shallow warm waters', 'Part of the National Marine Park'],
		sortOrder: 3,
	},
	{
		id: 'route_keri_caves',
		name: 'Keri Caves & Mizithres',
		duration: '4 hours',
		image: '/images/image_skipper.png',
		description: 'Discover the stunning sea caves of Keri and the impressive Mizithres rock formations on the southwestern coast. A hidden gem with dramatic cliffs dropping into deep blue water.',
		highlights: ['Impressive rock pillars', 'Sea caves to explore', 'Deep blue swimming spots', 'Secluded and less crowded'],
		sortOrder: 4,
	},
	{
		id: 'route_full_island',
		name: 'Full Island Tour',
		duration: '7 hours',
		image: '/images/unnamed.jpg',
		description: 'The ultimate Zakynthos experience — circumnavigate the entire island in one day. Visit Navagio, Blue Caves, Xigia Beach, and the south coast caves all in a single unforgettable trip.',
		highlights: ['Complete island experience', 'All major landmarks in one trip', 'Multiple swimming stops', 'Best value for a full day'],
		sortOrder: 5,
	},
	{
		id: 'route_xigia',
		name: 'Xigia Sulphur Beach',
		duration: '4 hours',
		image: '/images/IMG_6416.jpeg',
		description: 'A unique natural spa experience — Xigia Beach features natural sulphur springs flowing into the sea. The mineral-rich waters are believed to have therapeutic properties.',
		highlights: ['Natural sulphur springs', 'Therapeutic mineral waters', 'Beautiful small cove', 'Combine with Blue Caves visit'],
		sortOrder: 6,
	},
];

export const GET: APIRoute = async () => {
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const col = db.collection('routes');
		const snap = await col.orderBy('sortOrder', 'asc').get();
		if (snap.empty) {
			for (const route of SEED_ROUTES) {
				const { id, ...rest } = route;
				await col.doc(id).set(rest);
			}
			const after = await col.orderBy('sortOrder', 'asc').get();
			const list = after.docs.map(toRouteDoc).filter(Boolean);
			return json(list);
		}
		const list = snap.docs.map(toRouteDoc).filter(Boolean);
		return json(list);
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to fetch routes' }, 500);
	}
};

type RoutePayload = {
	id: string;
	name?: string;
	duration?: string;
	image?: string;
	description?: string;
	highlights?: string[];
	sortOrder?: number;
};

export const PUT: APIRoute = async ({ request }) => {
	const session = await verifySession(request);
	if (!session) return json({ error: 'Unauthorized' }, 401);
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const body = (await request.json()) as RoutePayload;
		const id = String(body.id ?? '').trim();
		if (!id) return json({ error: 'id required' }, 400);
		const ref = db.collection('routes').doc(id);
		const update: Record<string, unknown> = {};
		if (body.name !== undefined) update.name = String(body.name).trim();
		if (body.duration !== undefined) update.duration = String(body.duration).trim();
		if (body.image !== undefined) update.image = String(body.image).trim();
		if (body.description !== undefined) update.description = String(body.description).trim();
		if (body.highlights !== undefined) update.highlights = Array.isArray(body.highlights) ? body.highlights.map(String) : [];
		if (body.sortOrder !== undefined) update.sortOrder = Number(body.sortOrder) ?? 0;
		if (Object.keys(update).length > 0) await ref.set(update, { merge: true });
		return json({ ok: true });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to update route' }, 500);
	}
};

export const DELETE: APIRoute = async ({ request }) => {
	const session = await verifySession(request);
	if (!session) return json({ error: 'Unauthorized' }, 401);
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const { id } = (await request.json()) as { id?: string };
		if (!id) return json({ error: 'id required' }, 400);
		await db.collection('routes').doc(id).delete();
		return json({ ok: true });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to delete route' }, 500);
	}
};
