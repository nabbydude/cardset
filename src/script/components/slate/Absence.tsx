import React from "react";
import { BaseElement, Element } from "slate";
import { RenderElementProps } from "slate-react";
import { PlainText } from "./PlainText";

export interface Absence extends BaseElement {
	type: "Absence",
	children: PlainText[],
}

export function isAbsence(value: unknown): value is Absence {
	return Element.isElement(value) && value.type === "Absence";
}

export function AbsenceElement(props: RenderElementProps) {
	return (
		<div {...props.attributes}>
			{props.children}
		</div>
	);
}
