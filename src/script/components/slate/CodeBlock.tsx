import React from "react";
import { BaseElement } from "slate";
import { RenderElementProps } from "slate-react";
import { StyledText } from "./StyledText";

export interface CodeBlock extends BaseElement {
	type: "CodeBlock",
	children: StyledText[]
}

export function CodeBlockElement(props: RenderElementProps) {
	return (
		<pre {...props.attributes}>
			<code>{props.children}</code>
		</pre>
	);
}
