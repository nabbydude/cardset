import React from "react";
import { BaseElement, Element } from "slate";
import { TypedRenderElementProps } from "./RenderElement";

export interface EmbeddedProperty extends BaseElement {
	type: "EmbeddedProperty",
	propertyId: string,
	error?: embeddedPropertyError,
}

type embeddedPropertyError = "recursive" | "propertyMissing" | "propertyWrongType"

export function EmbeddedPropertyElement(props: TypedRenderElementProps<EmbeddedProperty>) {
	let snippet;
	switch (props.element.error) {
		case undefined: break;
		case "recursive"        : snippet = <span>ERROR: Recursive</span>          ; break;
		case "propertyMissing"  : snippet = <span>ERROR: Property Missing</span>   ; break;
		case "propertyWrongType": snippet = <span>ERROR: Property Wrong Type</span>; break;
		default                 : snippet = <span>ERROR: Unknown Error</span>      ; break;
	}
	return (
		<div className="embeddedProperty" data-error={props.element.error} {...props.attributes}>
			{props.children}
			{snippet}
		</div>
	);
}

export function isEmbeddedProperty(value: unknown): value is EmbeddedProperty {
	return Element.isElement(value) && value.type === "EmbeddedProperty";
}
