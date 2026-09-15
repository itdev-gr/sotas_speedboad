/** Boat photos currently live on a Supabase bucket that returns 402
 * (`exceed_cached_egress_quota`). Public pages must not hotlink those URLs. */

const RESTRICTED_HOST = /supabase\.co\/storage\//i;

const BOAT_FALLBACK: Record<string, string> = {
	boat1: '/images/self-drive-boat.webp',
	boat2: '/images/fleet-experience.webp',
	boat3: '/images/skipper-drive.webp',
	boat_1780128702871: '/images/image_skipper.webp',
};

function defaultFallback(kind: 'license-free' | 'skipper'): string {
	return kind === 'skipper' ? '/images/skipper-drive.webp' : '/images/self-drive-boat.webp';
}

export function isRestrictedStorageUrl(url: string | undefined): boolean {
	return !!url && RESTRICTED_HOST.test(url);
}

export function publicBoatImage(
	url: string | undefined,
	boatId: string,
	kind: 'license-free' | 'skipper' = 'license-free',
): string {
	const fallback = BOAT_FALLBACK[boatId] || defaultFallback(kind);
	if (!url || isRestrictedStorageUrl(url)) return fallback;
	return url;
}

export function publicBoatGallery(
	urls: string[] | undefined,
	cardUrl: string | undefined,
	boatId: string,
	kind: 'license-free' | 'skipper' = 'license-free',
): string[] {
	const fallback = publicBoatImage(cardUrl, boatId, kind);
	const list = urls?.length ? urls : cardUrl ? [cardUrl] : [];
	const usable = list.filter((u) => u && !isRestrictedStorageUrl(u));
	return usable.length ? usable : [fallback];
}

export function withPublicBoatImages<T extends { id: string; imageUrl?: string; imageUrls?: string[] }>(
	boat: T,
	kind: 'license-free' | 'skipper' = 'license-free',
): T {
	return {
		...boat,
		imageUrl: publicBoatImage(boat.imageUrl, boat.id, kind),
		imageUrls: publicBoatGallery(boat.imageUrls, boat.imageUrl, boat.id, kind),
	};
}
