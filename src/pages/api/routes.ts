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

export const GET: APIRoute = async () => {
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const snap = await db.collection('routes').orderBy('sortOrder', 'asc').get();
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
