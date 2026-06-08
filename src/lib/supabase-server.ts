import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client. Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * (NOT the PUBLIC_* variants) so the service-role key never reaches the browser.
 * Used by /api/upload for admin image uploads/deletes.
 */
let client: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
	if (client) return client;
	const url = import.meta.env.SUPABASE_URL;
	const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) {
		if (import.meta.env.DEV) {
			const missing = [!url && 'SUPABASE_URL', !key && 'SUPABASE_SERVICE_ROLE_KEY'].filter(Boolean);
			console.warn('[supabase-server] Not configured. Add to env:', missing.join(', '));
		}
		return null;
	}
	client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
	return client;
}
