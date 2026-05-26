import type { APIRoute } from 'astro';
import { getDb } from '../../lib/firebase-admin';
import { verifySession } from '../../lib/auth';

export const prerender = false;

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const GET: APIRoute = async ({ request }) => {
	const session = await verifySession(request);
	if (!session) return json({ error: 'Unauthorized' }, 401);
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const snap = await db.collection('booking_requests').orderBy('createdAt', 'desc').get();
		const requests = snap.docs.map((d) => {
			const data = d.data();
			return {
				id: d.id,
				customerName: data.customerName ?? null,
				email: data.email ?? null,
				phone: data.phone ?? null,
				boatId: data.boatId ?? null,
				rentalDate: data.rentalDate ?? null,
				duration: data.duration ?? null,
				service: data.service ?? null,
				promo: data.promo ?? null,
				notes: data.notes ?? null,
				source: data.source ?? null,
				status: data.status ?? 'new',
				createdAt: data.createdAt ?? null,
			};
		});
		return json(requests);
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to fetch booking requests' }, 500);
	}
};

export const POST: APIRoute = async ({ request }) => {
	if (request.headers.get('Content-Type')?.includes('application/json') === false) {
		return json({ error: 'Expected JSON' }, 400);
	}
	let body: {
		customerName?: string;
		email?: string;
		phone?: string;
		boatId?: string;
		rentalDate?: string;
		duration?: string;
		service?: string;
		promo?: string;
		notes?: string;
		source?: string;
	};
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, 400);
	}

	const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
	const email = typeof body.email === 'string' ? body.email.trim() : '';
	const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
	const boatId = typeof body.boatId === 'string' ? body.boatId.trim() : '';
	const rentalDate = typeof body.rentalDate === 'string' ? body.rentalDate.trim() : '';
	const duration = typeof body.duration === 'string' ? body.duration.trim() : '';
	const service = typeof body.service === 'string' ? body.service.trim() : '';
	const promo = typeof body.promo === 'string' ? body.promo.trim() : '';
	const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
	const source = typeof body.source === 'string' ? body.source.trim() : '';

	if (!boatId) return json({ error: 'Please select a boat.' }, 400);
	if (!rentalDate) return json({ error: 'Please select a rental date.' }, 400);
	if (!email && !phone) return json({ error: 'Email or phone is required so we can reach you.' }, 400);
	if (email && !EMAIL_REGEX.test(email)) return json({ error: 'Invalid email format' }, 400);

	const db = getDb();
	if (!db) return json({ error: 'Service temporarily unavailable' }, 503);
	try {
		const doc = {
			customerName: customerName || null,
			email: email || null,
			phone: phone || null,
			boatId,
			rentalDate,
			duration: duration || null,
			service: service || null,
			promo: promo || null,
			notes: notes || null,
			source: source || null,
			status: 'new',
			createdAt: new Date().toISOString(),
		};
		const ref = await db.collection('booking_requests').add(doc);
		return json({ ok: true, id: ref.id });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to save booking request' }, 500);
	}
};
