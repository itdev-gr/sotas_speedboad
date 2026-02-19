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

const DEFAULT_INCLUDES = [
	'Meet at the Port',
	'Coolbox with Ice',
	'Bluetooth Speaker Onboard',
	'Sun Canopy',
	'Sunbathing Area',
	'GPS Tracking',
	'60 HP Engine + Backup Engine',
	'All Required Safety Equipment',
];

const SEED_BOATS: Array<{ id: string; name: string; imageUrl: string; imageUrls?: string[]; price4h: number; price7h: number; maxPax: number; modalName: string; includes: string[]; lengthMeters: string; fuelExcludedText: string; sortOrder: number }> = [
	{
		id: 'boat1',
		name: 'Boat 1',
		imageUrl: '/images/self-drive-boat.png',
		price4h: 180,
		price7h: 250,
		maxPax: 6,
		modalName: 'Daphne',
		includes: [...DEFAULT_INCLUDES],
		lengthMeters: '5',
		fuelExcludedText: 'Fuel not included',
		sortOrder: 1,
	},
	{
		id: 'boat2',
		name: 'Boat 2',
		imageUrl: '/images/fleet-experience.png',
		imageUrls: ['/images/fleet-experience.png', '/images/fleet-experience.png', '/images/fleet-experience.png', '/images/fleet-experience.png', '/images/fleet-experience.png', '/images/fleet-experience.png'],
		price4h: 200,
		price7h: 270,
		maxPax: 7,
		modalName: 'Elena',
		includes: [...DEFAULT_INCLUDES],
		lengthMeters: '5.4',
		fuelExcludedText: 'Fuel not included',
		sortOrder: 2,
	},
	{
		id: 'boat3',
		name: 'Boat 3',
		imageUrl: '/images/skipper-drive.png',
		price4h: 200,
		price7h: 270,
		maxPax: 7,
		modalName: 'Valeria',
		includes: [...DEFAULT_INCLUDES],
		lengthMeters: '5.5',
		fuelExcludedText: 'Fuel not included',
		sortOrder: 3,
	},
];

type SkipperService = { name: string; durationHours: number; price: number; description?: string };

function normalizeSkipperServices(raw: unknown): SkipperService[] {
	if (!Array.isArray(raw)) return [];
	return raw.map((item) => {
		if (item == null || typeof item !== 'object') return { name: '', durationHours: 0, price: 0, description: '' };
		const o = item as Record<string, unknown>;
		return {
			name: String(o.name ?? ''),
			durationHours: Number(o.durationHours) || 0,
			price: Number(o.price) || 0,
			description: o.description !== undefined ? String(o.description ?? '') : undefined,
		};
	});
}

function toBoatDoc(d: QueryDocumentSnapshot) {
	const data = d.data();
	if (!data) return null;
	return {
		id: d.id,
		name: String(data.name ?? ''),
		imageUrl: String(data.imageUrl ?? ''),
		imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls.map(String) : [],
		price4h: Number(data.price4h) || 0,
		price7h: Number(data.price7h) || 0,
		skipperPrice4h: Number(data.skipperPrice4h) ?? 0,
		skipperPrice7h: Number(data.skipperPrice7h) ?? 0,
		skipperServices: normalizeSkipperServices(data.skipperServices),
		maxPax: Number(data.maxPax) || 0,
		modalName: String(data.modalName ?? ''),
		includes: Array.isArray(data.includes) ? data.includes.map(String) : [],
		lengthMeters: String(data.lengthMeters ?? ''),
		fuelExcludedText: String(data.fuelExcludedText ?? 'Fuel not included'),
		sortOrder: Number(data.sortOrder) ?? 0,
		description: String(data.description ?? ''),
	};
}

export const GET: APIRoute = async () => {
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const col = db.collection('boats');
		const snap = await col.orderBy('sortOrder', 'asc').get();
		if (snap.empty) {
			for (const boat of SEED_BOATS) {
				const { id, ...rest } = boat;
				await col.doc(id).set(rest);
			}
			const after = await col.orderBy('sortOrder', 'asc').get();
			const list = after.docs.map(toBoatDoc).filter(Boolean);
			return json(list);
		}
		const list = snap.docs.map(toBoatDoc).filter(Boolean);
		return json(list);
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to fetch boats' }, 500);
	}
};

type BoatPayload = {
	id: string;
	name?: string;
	imageUrl?: string;
	imageUrls?: string[];
	price4h?: number;
	price7h?: number;
	skipperPrice4h?: number;
	skipperPrice7h?: number;
	skipperServices?: SkipperService[];
	maxPax?: number;
	modalName?: string;
	includes?: string[];
	lengthMeters?: string;
	fuelExcludedText?: string;
	sortOrder?: number;
	description?: string;
};

export const PUT: APIRoute = async ({ request }) => {
	const session = await verifySession(request);
	if (!session) return json({ error: 'Unauthorized' }, 401);
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const body = (await request.json()) as BoatPayload;
		const id = String(body.id ?? '').trim();
		if (!id) return json({ error: 'id required' }, 400);
		const ref = db.collection('boats').doc(id);
		const update: Record<string, unknown> = {};
		if (body.name !== undefined) update.name = String(body.name).trim();
		if (body.imageUrl !== undefined) update.imageUrl = String(body.imageUrl).trim();
		if (body.imageUrls !== undefined) update.imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls.map(String) : [];
		if (body.price4h !== undefined) update.price4h = Number(body.price4h) || 0;
		if (body.price7h !== undefined) update.price7h = Number(body.price7h) || 0;
		if (body.skipperPrice4h !== undefined) update.skipperPrice4h = Number(body.skipperPrice4h) || 0;
		if (body.skipperPrice7h !== undefined) update.skipperPrice7h = Number(body.skipperPrice7h) || 0;
		if (body.skipperServices !== undefined) update.skipperServices = normalizeSkipperServices(body.skipperServices);
		if (body.maxPax !== undefined) update.maxPax = Number(body.maxPax) || 0;
		if (body.modalName !== undefined) update.modalName = String(body.modalName).trim();
		if (body.includes !== undefined) update.includes = Array.isArray(body.includes) ? body.includes.map(String) : [];
		if (body.lengthMeters !== undefined) update.lengthMeters = String(body.lengthMeters).trim();
		if (body.fuelExcludedText !== undefined) update.fuelExcludedText = String(body.fuelExcludedText).trim();
		if (body.sortOrder !== undefined) update.sortOrder = Number(body.sortOrder) ?? 0;
		if (body.description !== undefined) update.description = String(body.description).trim();
		if (Object.keys(update).length > 0) await ref.set(update, { merge: true });
		return json({ ok: true });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to update boat' }, 500);
	}
};
