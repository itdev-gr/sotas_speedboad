export type LicenseFreeBoat = {
	id: string;
	licenseFreeVisible?: boolean;
};

/** Boats shown on the License Free Rent page (self-drive). */
export function filterLicenseFreeBoats<T extends LicenseFreeBoat>(boats: T[]): T[] {
	return boats.filter((boat) => boat.licenseFreeVisible !== false);
}
