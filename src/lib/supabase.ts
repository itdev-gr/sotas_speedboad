import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

/** Get the public URL for a file in the `images` bucket (cache-busted). */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from('images').getPublicUrl(path);
  return `${data.publicUrl}?t=${Date.now()}`;
}
