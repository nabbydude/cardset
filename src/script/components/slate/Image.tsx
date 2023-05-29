import React from "react";
import { BaseElement, Element } from "slate";
import { RenderElementProps } from "slate-react";

export interface Image extends BaseElement {
	type: "Image",
	src: string | null,
}

export function ImageElement(props: RenderElementProps) {
	return (
		<img {...props.attributes}>
			{props.children}
		</img>
	)
}

export function isImage(value: any): value is Image {
	return Element.isElement(value) && value.type === "Image" && (value.src === null || typeof value.src === "string");
}
