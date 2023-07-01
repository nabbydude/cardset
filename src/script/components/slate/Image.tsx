import React, { useEffect } from "react";
import { BaseElement, Element } from "slate";
import { RenderElementProps } from "../../slate";
import { useImageStore } from "../contexts/ImageStoreContext";

export interface Image extends BaseElement {
	type: "Image",
	src: string | number | undefined,
}

export function ImageElement(props: RenderElementProps<Image>) {
	const image_store = useImageStore();
	const src = (typeof props.element?.src === "number" ? image_store.get(props.element.src)?.url : props.element?.src) ?? "";

	return (
		<div {...props.attributes} className="image">
			<img src={src}/>
			{props.children}
		</div>
	)
}

export function isImage(value: any): value is Image {
	return Element.isElement(value) && value.type === "Image" && (value.src === undefined || typeof value.src === "string");
}
