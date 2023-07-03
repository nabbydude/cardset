import React from "react";
import { BaseElement, Element } from "slate";
import { RenderElementProps } from "../../slate";

export interface Icon extends BaseElement {
	type: "Icon",
	alt: string,
	src: string,
}

export function IconElement(props: RenderElementProps<Icon>) {
	return (
		<span {...props.attributes} className="icon">
			<img src={props.element.src ?? ""} alt={props.element.alt}/>
			{props.children}
		</span>
	);
}

export function isIcon(value: unknown): value is Icon {
	return Element.isElement(value) && value.type === "Icon" && typeof value.src === "string";
}
