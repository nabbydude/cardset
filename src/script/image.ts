export interface base_image {
	type: string,
	url: string,
}

export interface asset_image extends base_image {
	type: "asset",
	name: string,
}

export interface blob_image extends base_image {
	type: "blob",
	blob: Blob,
}

export type image = (
	| asset_image
	| blob_image
);

export function load_asset_image_from_url(name: string, url: string): asset_image{
	return {
		type: "asset",
		name,
		url,
	};
}

export function load_image_from_blob(blob: Blob): blob_image {
	return {
		type: "blob",
		url: URL.createObjectURL(blob),
		blob,
	};
}

export function unload_image(image: image) {
	URL.revokeObjectURL(image.url);
}
