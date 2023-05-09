import React from "react";
import { BaseElement } from "slate";
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
