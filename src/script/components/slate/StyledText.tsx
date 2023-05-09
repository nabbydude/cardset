import React from "react";
import { BaseText, Text } from "slate";
import { RenderLeafProps } from "../../slate";

export interface StyledText extends BaseText {
	bold: boolean,
	italic: boolean,
}

export function StyledTextElement(props: RenderLeafProps<StyledText>) {
	return (
		<span
			{...props.attributes}
			style={{ fontWeight: props.leaf.bold ? "bold" : "normal" }}
		>
			{props.children}
		</span>
	)
}

export function isStyledText(value: any): value is StyledText {
	return Text.isText(value) && "bold" in value && "italic" in value;
}
