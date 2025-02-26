import React from "react";
import { BaseElement, Element } from "slate";
import { TypedRenderElementProps } from "./RenderElement";

export interface Field extends BaseElement {
	type: "Field",
}

export function FieldElement(props: TypedRenderElementProps<Field>) {
	return (
		<div {...props.attributes}>
			{props.children}
		</div>
	);
}

export function isField(value: unknown): value is Field {
	return Element.isElement(value) && value.type === "Field";
}
