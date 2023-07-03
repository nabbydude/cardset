import React from "react";
import { BaseText } from "slate";
import { RenderLeafProps } from "slate-react";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PlainText extends BaseText {

}

export function PlainTextElement(props: RenderLeafProps) {
	return (
		<span {...props.attributes}>
			{props.children}
		</span>
	);
}
