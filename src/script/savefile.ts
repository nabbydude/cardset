/*
	savefile is a zip with this structure:

	/
	+-meta.json: meta
	+-cards/
	| +-[card_id].json: dehydrated_card
	+-images/
	| +-[image_id].[filetype]: (blob)

*/

import { property, property_value } from "./property";

// version

export type savefile_version = readonly [number, number, number];

export const current_savefile_version = [0, 3, 0] as const;

export function isVersion(version: unknown): version is savefile_version {
	return (
		version instanceof Array &&
		version.length === 3 &&
		typeof version[0] === "number" &&
		typeof version[1] === "number" &&
		typeof version[2] === "number"
	);
}

export function compareVersion(version: savefile_version, other: savefile_version): number {
	if (version[0] > other[0]) return 1;
	if (version[0] < other[0]) return -1;
	if (version[1] > other[1]) return 1;
	if (version[1] < other[1]) return -1;
	if (version[2] > other[2]) return 1;
	if (version[2] < other[2]) return -1;
	return 0;
}

export function version_is_earlier(version: savefile_version, other: savefile_version): boolean {
	return compareVersion(version, other) < 0;
}

export function version_is_same_or_earlier(version: savefile_version, other: savefile_version): boolean {
	return compareVersion(version, other) <= 0;
}

export function version_is_later(version: savefile_version, other: savefile_version): boolean {
	return compareVersion(version, other) > 0;
}

export function version_is_same_or_later(version: savefile_version, other: savefile_version): boolean {
	return compareVersion(version, other) >= 0;
}

// metadata

export interface base_meta {
	version: savefile_version,
}

export interface v0_1_0_meta {
	version: [0, 1, 0],
	name: string,
}

// export interface future_meta extends Omit<v0_1_0_meta, "version"> {
// 	version: typeof current_savefile_version,
// 	name: string,
// }

export type current_meta = Omit<v0_1_0_meta, "version"> & { version: typeof current_savefile_version }

export function is_base_meta(meta: unknown): meta is base_meta {
	return !!meta && isVersion((meta as base_meta).version);
}

// dehydrated_card

export interface dehydrated_card {
	id: string,
	properties: Record<string, dehydrated_property>,
}


// warning does not deep check properties
export function is_dehydrated_card(dehydrated_card: unknown): dehydrated_card is dehydrated_card {
	return !!dehydrated_card &&
		typeof (dehydrated_card as dehydrated_card).id === "string" &&
		typeof (dehydrated_card as dehydrated_card).properties === "object";
}

// dehydrated_property

export interface dehydrated_property<P extends property = property> {
	type: P["type"],
	value: property_value<property>,
}

// image

export const mimeTypeToFileExtension: Record<string, string> = {
	["image/avif"]: "avif",
	["image/gif"]: "gif",
	["image/jpeg"]: "jpg",
	["image/png"]: "png",
	["image/svg+xml"]: "svg",
	["image/webp"]: "webp",
};
