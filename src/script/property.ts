import { Descendant } from "slate";
import { image } from "./image";
import { observable } from "./observable";
import { operation, generic_property_operation, text_property_operation } from "./operation";

export interface base_property<V extends unknown, O extends operation> extends observable<O> {
	id: string,
	type: string,
	value: V,
}

export interface text_property extends base_property<{ children: Descendant[] }, text_property_operation> {
	type: "text",
}

export interface image_property extends base_property<image | undefined, generic_property_operation> {
	type: "image",
}

export interface enum_property extends base_property<string, generic_property_operation> {
	type: "enum",
}

export type property = (
	| text_property
	| image_property
	| enum_property
);

export type property_value<P extends property> = P["value"];
