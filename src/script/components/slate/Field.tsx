import React from "react";
import { BaseElement, Element } from "slate";
import { RenderElementProps } from "../../slate";

export interface Field extends BaseElement {
	type: "Field",
	name: string,
}

export function FieldElement(props: RenderElementProps<Field>) {
	return (
		<div {...props.attributes} data-name={props.element.name}>
			{props.children}
		</div>
	);
}

export function isField(value: unknown): value is Field {
	return Element.isElement(value) && value.type === "Field" && (typeof value.name === "string");
}
