import React from "react";
import { BaseText } from "slate";
import { RenderLeafProps } from "slate-react";

export interface StyledText extends BaseText {
	text: string,
	bold: boolean,
	italic: boolean,
};

export function StyledTextElement(props: RenderLeafProps) {
	return (
		<span
			{...props.attributes}
			style={{ fontWeight: props.leaf.bold ? "bold" : "normal" }}
		>
			{props.children}
		</span>
	)
}
