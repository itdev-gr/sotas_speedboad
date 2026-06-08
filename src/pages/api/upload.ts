import type { APIRoute } from 'astro';
import { getSupabaseAdmin } from '../../lib/supabase-server';
import { verifySession } from '../../lib/auth';

export const prerender = false;

const BUCKET = 'images';
const ALLOWED_FOLDERS = new Set(['boats', 'routes']);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

function safeSegment(s: string): string {
	return s.replace(/[^a-zA-Z0-9_-]/g, '');
}

function extFor(file: File): string {
	const fromType: Record<string, string> = {
		'image/jpeg': 'jpg',
		'image/png': 'png',
		'image/webp': 'webp',
		'image/gif': 'gif',
		'image/avif': 'avif',
	};
	if (file.type && fromType[file.type]) return fromType[file.type];
	const e = (file.name.split('.').pop() || '').toLowerCase().replace(/[^a-z0-9]/g, '');
	return e || 'jpg';
}

/** Upload an image. multipart/form-data: file, folder (boats|routes), id. */
export const POST: APIRoute = async ({ request }) => {
	const session = await verifySession(request);
	if (!session) return json({ error: 'Unauthorized' }, 401);
	const supabase = getSupabaseAdmin();
	if (!supabase) return json({ error: 'Storage not configured' }, 503);

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return json({ error: 'Invalid form data' }, 400);
	}

	const file = form.get('file');
	const folder = safeSegment(String(form.get('folder') ?? '').trim());
	const id = safeSegment(String(form.get('id') ?? '').trim());

	if (!(file instanceof File)) return json({ error: 'file required' }, 400);
	if (!ALLOWED_FOLDERS.has(folder)) return json({ error: 'invalid folder' }, 400);
	if (!id) return json({ error: 'id required' }, 400);
	if (file.size > MAX_BYTES) return json({ error: 'file too large (max 10 MB)' }, 413);
	if (file.type && !ALLOWED_TYPES.has(file.type)) return json({ error: 'unsupported file type' }, 415);

	const path = `${folder}/${id}/img_${Date.now()}.${extFor(file)}`;
	const bytes = new Uint8Array(await file.arrayBuffer());

	const { error } = await supabase.storage
		.from(BUCKET)
		.upload(path, bytes, { upsert: true, contentType: file.type || 'image/jpeg' });
	if (error) {
		console.error('[upload] supabase error:', error.message);
		return json({ error: 'Upload failed' }, 500);
	}

	const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
	return json({ ok: true, path, url: `${data.publicUrl}?t=${Date.now()}` });
};

/** Delete an image. JSON: { path } or { url }. */
export const DELETE: APIRoute = async ({ request }) => {
	const session = await verifySession(request);
	if (!session) return json({ error: 'Unauthorized' }, 401);
	const supabase = getSupabaseAdmin();
	if (!supabase) return json({ error: 'Storage not configured' }, 503);

	let body: { path?: string; url?: string };
	try {
		body = (await request.json()) as { path?: string; url?: string };
	} catch {
		return json({ error: 'Invalid JSON' }, 400);
	}

	let path = (body.path ?? '').trim();
	if (!path && body.url) {
		const m = String(body.url).match(/\/images\/(.+?)(\?|$)/);
		if (m) path = m[1];
	}
	if (!path) return json({ error: 'path required' }, 400);
	// Only allow deleting within known folders.
	const top = path.split('/')[0];
	if (!ALLOWED_FOLDERS.has(top)) return json({ error: 'invalid path' }, 400);

	const { error } = await supabase.storage.from(BUCKET).remove([path]);
	if (error) {
		console.error('[upload] delete error:', error.message);
		return json({ error: 'Delete failed' }, 500);
	}
	return json({ ok: true });
};
