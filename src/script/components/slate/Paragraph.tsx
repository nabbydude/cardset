import React from "react";
import { CustomText, SlateProps } from "../util";

export interface Paragraph { type: "Paragraph", children: CustomText[] };

export function ParagraphElement(props: SlateProps) {
	return (
		<p {...props.attributes}>
			{props.children}
		</p>
	)
}
