import React from "react";
import { BaseElement, Element } from "slate";
import { RenderElementProps } from "slate-react";

export interface Field extends BaseElement {
	type: "Field",
	name: string,
}

export function FieldElement(props: RenderElementProps) {
	return (
		<div {...props.attributes}>
			{props.children}
		</div>
	)
}

export function isField(value: any): value is Field {
	return Element.isElement(value) && value.type === "Field" && (typeof value.name === "string");
}
