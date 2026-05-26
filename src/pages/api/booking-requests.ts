import type { APIRoute } from 'astro';
import { Resend } from 'resend';
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

const NOTIFICATION_TO = 'sotatravel1@gmail.com';
const NOTIFICATION_FROM = 'Sota Travel <onboarding@resend.dev>';

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

async function sendNotificationEmail(opts: {
	id: string;
	customerName: string | null;
	email: string | null;
	phone: string | null;
	boatId: string;
	boatName: string | null;
	rentalDate: string;
	duration: string | null;
	service: string | null;
	promo: string | null;
	notes: string | null;
	source: string | null;
	createdAt: string;
}) {
	const apiKey = import.meta.env.RESEND_API_KEY;
	if (!apiKey) {
		console.warn('[booking-requests] RESEND_API_KEY not set — skipping email notification');
		return;
	}
	try {
		const resend = new Resend(apiKey);
		const rows: Array<[string, string]> = [
			['Customer', opts.customerName ?? '—'],
			['Email', opts.email ?? '—'],
			['Phone', opts.phone ?? '—'],
			['Boat', opts.boatName ? `${opts.boatName} (${opts.boatId})` : opts.boatId],
			['Rental date', opts.rentalDate],
			['Duration', opts.duration ?? '—'],
			['Service', opts.service ?? '—'],
			['Promo code', opts.promo ?? '—'],
			['Source', opts.source ?? '—'],
			['Notes', opts.notes ?? '—'],
			['Submitted at', opts.createdAt],
			['Request ID', opts.id],
		];
		const html =
			`<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">` +
			`<h2 style="color: #064250; margin-bottom: 8px;">New booking request</h2>` +
			`<p style="color: #555; margin-top: 0;">A customer just submitted a booking request from the website.</p>` +
			`<table cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-top: 12px;">` +
			rows
				.map(
					([k, v]) =>
						`<tr><td style="border-bottom: 1px solid #e5e5e5; font-weight: 600; width: 140px; vertical-align: top;">${escapeHtml(k)}</td><td style="border-bottom: 1px solid #e5e5e5; white-space: pre-wrap;">${escapeHtml(v)}</td></tr>`
				)
				.join('') +
			`</table>` +
			`<p style="margin-top: 20px; color: #555;">View all requests at <a href="https://rentaboatzakynthos.com/dashboard/booking-requests" style="color: #064250;">the admin dashboard</a>.</p>` +
			`</div>`;
		const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n') +
			`\n\nView all requests: https://rentaboatzakynthos.com/dashboard/booking-requests`;
		const subjectName = opts.customerName || opts.email || opts.phone || 'customer';
		await resend.emails.send({
			from: NOTIFICATION_FROM,
			to: [NOTIFICATION_TO],
			replyTo: opts.email ?? undefined,
			subject: `New booking request — ${subjectName} — ${opts.boatName ?? opts.boatId} ${opts.rentalDate}`,
			html,
			text,
		});
	} catch (e) {
		console.error('[booking-requests] Failed to send notification email:', e);
	}
}

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
		const createdAt = new Date().toISOString();
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
			createdAt,
		};
		const ref = await db.collection('booking_requests').add(doc);

		let boatName: string | null = null;
		try {
			const boatSnap = await db.collection('boats').doc(boatId).get();
			if (boatSnap.exists) {
				const data = boatSnap.data() as { name?: string } | undefined;
				boatName = data?.name ?? null;
			}
		} catch (e) {
			console.warn('[booking-requests] Boat name lookup failed:', e);
		}

		await sendNotificationEmail({
			id: ref.id,
			customerName: customerName || null,
			email: email || null,
			phone: phone || null,
			boatId,
			boatName,
			rentalDate,
			duration: duration || null,
			service: service || null,
			promo: promo || null,
			notes: notes || null,
			source: source || null,
			createdAt,
		});

		return json({ ok: true, id: ref.id });
	} catch (e) {
		console.error(e);
		return json({ error: 'Failed to save booking request' }, 500);
	}
};
