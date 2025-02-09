import React from "react";
import { BaseText } from "slate";
import { RenderLeafProps } from "../../slate";

export interface StyledText extends BaseText {
	bold?: true,
	italic?: true,
}

export function StyledTextElement(props: RenderLeafProps<StyledText>) {
	// console.log(`rendering ${props.text.text}`)
	return (
		<span
			{...props.attributes}
			style={{
				fontWeight: props.leaf.bold ? "bold" : "normal",
				fontStyle: props.leaf.italic ? "var(--italic-style)" : "var(--normal-style)",
			}}
		>
			{props.children}
		</span>
	);
}
