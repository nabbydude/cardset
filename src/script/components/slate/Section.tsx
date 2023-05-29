import React from "react";
import { BaseElement, Element } from "slate";
import { RenderElementProps } from "../../slate";

export interface Section extends BaseElement {
	type: "Section",
	name: string,
}

export function SectionElement(props: RenderElementProps<Section>) {
	return (
		<div {...props.attributes} className="section" data-name={props.element.name}>
			{props.children}
		</div>
	)
}

export function isSection(value: any): value is Section {
	return Element.isElement(value) && value.type === "Section" && (typeof value.name === "string");
}
