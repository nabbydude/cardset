import React from "react";
import { BaseElement, Element } from "slate";

export interface Document extends BaseElement {
	type: "Document",
	name: string,
}

export function isDocument(value: any): value is Document {
	return Element.isElement(value) && value.type === "Document" && (typeof value.name === "string");
}
