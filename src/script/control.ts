import { image } from "./image"

export interface base_control {
	id: string,
	type: string,
	property_id: string,
}


export interface text_control extends base_control {
	type: "text",
	min_font_size: number,
	max_font_size: number,
	pips_only?: boolean,
}

export interface image_control extends base_control {
	type: "image",
}

export interface image_enum_control extends base_control {
	type: "image_enum",
	options: enum_option<image>[],
}

export interface list_cell_control extends base_control {
	type: "list_cell",
}

export type control = text_control | image_control | image_enum_control


export interface enum_option<T> {
	id: string,
	label: string,
	value: T,
}
