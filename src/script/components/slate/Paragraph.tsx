import React from "react";
import { BaseElement } from "slate";
import { StyledText } from "./StyledText";
import { TypedRenderElementProps } from "./RenderElement";

export interface Paragraph extends BaseElement {
	type: "Paragraph",
	children: StyledText[]
}

export function ParagraphElement(props: TypedRenderElementProps<Paragraph>) {
	return (
		<p {...props.attributes}>
			{props.children}
		</p>
	);
}
