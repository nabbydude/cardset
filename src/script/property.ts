import { Descendant } from "slate";

export interface base_property {
	id: string,
	type: string,
}

export interface text_property {
	id: string,
	type: "text",
	nodes: Descendant[],
}

export interface image_property {
	id: string,
	type: "image",
	src?: image_src,
}

export type image_src = string;
// export type image_src = string | Blob;

export interface enum_property {
	id: string,
	type: "enum",
	/**id of the enum this references */
	enum: string,
	value: string,
}

export type property = (
	| text_property
	| image_property
	| enum_property
);
