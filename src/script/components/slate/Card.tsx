import React from "react";
import { BaseElement } from "slate";
import { RenderElementProps } from "slate-react";
import { Field } from "./Field";

export interface Card extends BaseElement {
	type: "Card",
	children: Field[],
};

export function CardElement(props: RenderElementProps) {
	return (
		<p {...props.attributes}>
			{props.children}
		</p>
	)
}
