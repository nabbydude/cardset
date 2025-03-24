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

export interface cropped_image extends base_image {
	type: "cropped",
	source: image,
	crop: crop,
}

export type image = (
	| asset_image
	| blob_image
);

export function load_asset_image_from_url(name: string, url: string): asset_image {
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

export interface crop {
	x: number;
	y: number;
	width: number;
	height: number;
	angle: number;
}

export async function crop_image(source: Blob, crop: crop ) {
	const canvas = new OffscreenCanvas(crop.width, crop.height);
	const context = canvas.getContext("2d");
	if (!context) throw Error("Failed to create canvas");

	context.translate(-crop.x, -crop.y);
	context.rotate(crop.angle/180 * Math.PI);

	context.drawImage(await createImageBitmap(source), 0, 0);
	return canvas.convertToBlob();
}

/**
 * Get xy offset of top left corner of rotated image, since cropper coordinates are calculated from the corner of the axis-aligned bounding box of the rotated rectangle
 */
export function getRotationOffset(width: number, height: number, angleInDegrees: number): { x: number, y: number } {
	angleInDegrees = ((angleInDegrees % 360) + 360) % 360;

	if (angleInDegrees ===   0) return { x: 0     , y: 0      };
	if (angleInDegrees ===  90) return { x: height, y: 0      };
	if (angleInDegrees === 180) return { x: width , y: height };
	if (angleInDegrees === 270) return { x: 0     , y: width  };

	const angleInRadians = (angleInDegrees * Math.PI) / 180;
	const sin = Math.sin(angleInRadians);
	const cos = Math.cos(angleInRadians);
	
	// const canvasSize = {
	// 	width:  Math.abs(cos*width) + Math.abs(sin*height),
	// 	height: Math.abs(cos*height) + Math.abs(sin*width),
	// };

	if (angleInDegrees <  90) return { x:              sin*height, y: 0                        };
	if (angleInDegrees < 180) return { x: -cos*width + sin*height, y: -cos*height              };
	if (angleInDegrees < 270) return { x: -cos*width             , y: -cos*height + -sin*width };
	                          return { x: 0                      , y:               -sin*width };
}
