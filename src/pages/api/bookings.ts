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

export const GET: APIRoute = async ({ request }) => {
	const session = await verifySession(request);
	if (!session) return json({ error: 'Unauthorized' }, 401);
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const snap = await db.collection('bookings').get();
		const bookings = snap.docs
			.map((d) => {
				const data = d.data();
				return {
					id: d.id,
					customerName: data.customerName,
					email: data.email,
					phone: data.phone,
					boatId: data.boatId,
					rentalDate: data.rentalDate,
					duration: data.duration,
					locationId: data.locationId,
					totalEur: data.totalEur,
					status: data.status,
					notes: data.notes,
					createdAt: data.createdAt,
					// Legacy fields for backward compatibility
					scooterId: data.scooterId,
					pickupDate: data.pickupDate,
					returnDate: data.returnDate,
					pickupLocationId: data.pickupLocationId,
					returnLocationId: data.returnLocationId,
				};
			})
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		return json(bookings);
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to fetch bookings' }, 500);
	}
};

export const POST: APIRoute = async ({ request }) => {
	const session = await verifySession(request);
	if (!session) return json({ error: 'Unauthorized' }, 401);
	const db = getDb();
	if (!db) return json({ error: 'Database not configured' }, 503);
	try {
		const body = (await request.json()) as {
			customerName?: string;
			email?: string;
			phone?: string;
			boatId?: string;
			rentalDate?: string;
			duration?: string;
			locationId?: string;
			totalEur?: number;
			status?: string;
			notes?: string;
		};
		const boatId = String(body.boatId ?? '').trim();
		const rentalDate = String(body.rentalDate ?? '').trim();
		const duration = String(body.duration ?? '4h').trim();

		if (!boatId || !rentalDate) {
			return json({ error: 'Boat and rental date are required.' }, 400);
		}

		const doc = {
			customerName: String(body.customerName ?? '').trim(),
			email: String(body.email ?? '').trim(),
			phone: String(body.phone ?? '').trim(),
			boatId,
			rentalDate,
			duration: duration === '7h' ? '7h' : '4h',
			locationId: String(body.locationId ?? '').trim(),
			totalEur: Number(body.totalEur) || 0,
			status: String(body.status ?? 'pending').trim(),
			notes: String(body.notes ?? '').trim(),
			createdAt: new Date().toISOString(),
		};

		// Availability: one non-cancelled booking per boat per day
		const existingSnap = await db
			.collection('bookings')
			.where('boatId', '==', boatId)
			.where('rentalDate', '==', rentalDate)
			.get();
		for (const d of existingSnap.docs) {
			const data = d.data();
			const statusLower = String(data.status ?? '').toLowerCase();
			if (statusLower === 'cancelled' || statusLower === 'canceled') continue;
			return json(
				{ error: 'This boat is already booked for the selected date. Choose another date or boat.' },
				409
			);
		}

		const ref = await db.collection('bookings').add(doc);
		return json({ ok: true, id: ref.id });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to create booking' }, 500);
	}
};
