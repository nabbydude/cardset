import React from "react";
import { BaseElement, Element } from "slate";
import { RenderElementProps } from "../../slate";

export interface Image extends BaseElement {
	type: "Image",
	src: string | null,
}

export function ImageElement(props: RenderElementProps<Image>) {
	return (
		<div {...props.attributes} className="image">
			<img  src={props.element.src ?? ""}/>
			{props.children}
		</div>
	)
}

export function isImage(value: any): value is Image {
	return Element.isElement(value) && value.type === "Image" && (value.src === null || typeof value.src === "string");
}
