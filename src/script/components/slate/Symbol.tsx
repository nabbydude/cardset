import React from "react";
import { BaseElement, Element } from "slate";
import { RenderElementProps } from "../../slate";

export interface Symbol extends BaseElement {
	type: "Symbol",
	alt: string,
	src: string,
}

export function SymbolElement(props: RenderElementProps<Symbol>) {
	return (
		<span {...props.attributes} className="symbol">
			<img src={props.element.src ?? ""} alt={props.element.alt}/>
			{props.children}
		</span>
	)
}

export function isSymbol(value: any): value is Symbol {
	return Element.isElement(value) && value.type === "Symbol" && typeof value.src === "string";
}
