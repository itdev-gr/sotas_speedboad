import type { APIRoute } from 'astro';
import { setSessionCookieHeader } from '../../lib/auth';
import { getAdminAuth } from '../../lib/firebase-admin';

export const prerender = false;

function json(body: unknown, status = 200, headers?: HeadersInit) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json', ...headers } as HeadersInit,
	});
}

function getAdminEmails(): string[] {
	const raw = import.meta.env.ADMIN_EMAILS;
	if (typeof raw !== 'string' || !raw.trim()) return [];
	return raw.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export const POST: APIRoute = async ({ request }) => {
	if (request.headers.get('Content-Type')?.includes('application/json') === false) {
		return json({ error: 'Expected JSON' }, 400);
	}
	let body: { idToken?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, 400);
	}
	const idToken = typeof body.idToken === 'string' ? body.idToken.trim() : null;
	if (!idToken) return json({ error: 'idToken required' }, 400);

	const auth = getAdminAuth();
	if (!auth) return json({ error: 'Auth not configured' }, 503);
	let decoded: { uid: string; email?: string | null };
	try {
		decoded = await auth.verifyIdToken(idToken);
	} catch {
		return json({ error: 'Invalid token' }, 401);
	}

	const adminEmails = getAdminEmails();
	if (adminEmails.length > 0) {
		const email = (decoded.email ?? '').trim().toLowerCase();
		if (!email || !adminEmails.includes(email)) {
			return json({ error: 'Access denied. Admin only.' }, 403);
		}
	}

	const expiresInMs = 60 * 60 * 24 * 5 * 1000; // 5 days
	let sessionCookie: string;
	try {
		sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: expiresInMs });
	} catch {
		return json({ error: 'Failed to create session' }, 500);
	}
	const cookieHeader = setSessionCookieHeader(sessionCookie, expiresInMs / 1000);
	return json({ ok: true }, 200, { 'Set-Cookie': cookieHeader });
};
