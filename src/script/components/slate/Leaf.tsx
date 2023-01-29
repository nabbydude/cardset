import React from "react";
import { RenderLeafProps } from "slate-react";

export interface StyledText {
	text: string,
	bold: boolean,
	italic: boolean,
};

export function LeafElement(props: RenderLeafProps) {
	return (
		<span
			{...props.attributes}
			style={{ fontWeight: props.leaf.bold ? "bold" : "normal" }}
		>
			{props.children}
		</span>
	)
}
