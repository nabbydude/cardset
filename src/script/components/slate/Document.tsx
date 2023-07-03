import { BaseElement, Element } from "slate";

export interface Document extends BaseElement {
	type: "Document",
	name: string,
}

export function isDocument(value: unknown): value is Document {
	return Element.isElement(value) && value.type === "Document" && (typeof value.name === "string");
}
