import React from "react";
import { BaseElement } from "slate";
import { RenderElementProps } from "slate-react";
import { StyledText } from "./StyledText";

export interface Paragraph extends BaseElement {
	type: "Paragraph",
	children: StyledText[]
};

export function ParagraphElement(props: RenderElementProps) {
	return (
		<p {...props.attributes}>
			{props.children}
		</p>
	)
}
