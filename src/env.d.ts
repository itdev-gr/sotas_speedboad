/// <reference path="../.astro/types.d.ts" />

declare namespace App {
	interface Locals {
		session?: { uid: string; email: string | null };
	}
}
