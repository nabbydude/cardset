import React from "react";
import { CustomText } from "../util";
import { RenderElementProps } from "slate-react";

export interface CodeBlock { type: "CodeBlock", children: CustomText[] };

export function CodeBlockElement(props: RenderElementProps) {
	return (
		<pre {...props.attributes}>
			<code>{props.children}</code>
		</pre>
	);
}
