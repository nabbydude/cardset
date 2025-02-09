export interface image {
	blob?: Blob,
	url: string,
}

export function dumb_load_image_from_url(url: string): image {
	return {
		url,
	};
}

export function load_image_from_blob(blob: Blob): image {
	return {
		blob,
		url: URL.createObjectURL(blob),
	};
}

export function unload_image(image: image) {
	URL.revokeObjectURL(image.url);
}
