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
		const snap = await db.collection('contacts').orderBy('createdAt', 'desc').get();
		const contacts = snap.docs.map((d) => {
			const data = d.data();
			return {
				id: d.id,
				firstname: data.firstname,
				lastname: data.lastname,
				country: data.country,
				phone: data.phone,
				email: data.email,
				message: data.message,
				createdAt: data.createdAt,
			};
		});
		return json(contacts);
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to fetch contacts' }, 500);
	}
};

export const POST: APIRoute = async ({ request }) => {
	if (request.headers.get('Content-Type')?.includes('application/json') === false) {
		return json({ error: 'Expected JSON' }, 400);
	}
	let body: { firstname?: string; lastname?: string; country?: string; phone?: string; email?: string; message?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, 400);
	}
	const firstname = typeof body.firstname === 'string' ? body.firstname.trim() : '';
	const lastname = typeof body.lastname === 'string' ? body.lastname.trim() : '';
	const country = typeof body.country === 'string' ? body.country.trim() : '';
	const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
	const email = typeof body.email === 'string' ? body.email.trim() : '';
	const message = typeof body.message === 'string' ? body.message.trim() : '';

	if (!firstname) return json({ error: 'firstname is required' }, 400);
	if (!lastname) return json({ error: 'lastname is required' }, 400);
	if (!email) return json({ error: 'email is required' }, 400);
	if (!EMAIL_REGEX.test(email)) return json({ error: 'Invalid email format' }, 400);
	if (!message) return json({ error: 'message is required' }, 400);

	const db = getDb();
	if (!db) return json({ error: 'Service temporarily unavailable' }, 503);
	try {
		const doc = {
			firstname,
			lastname,
			country: country || null,
			phone: phone || null,
			email,
			message,
			createdAt: new Date().toISOString(),
		};
		const ref = await db.collection('contacts').add(doc);
		return json({ ok: true, id: ref.id });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to save message' }, 500);
	}
};
