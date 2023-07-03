import React from "react";
import { BaseElement, Element } from "slate";
import { RenderElementProps } from "slate-react";
import { Field } from "./Field";
import { frameUrls } from "../../colorAssets";

export interface Card extends BaseElement {
	type: "Card",
	id: number,
	children: Field[],
}

export function isCard(value: unknown): value is Card {
	return Element.isElement(value) && value.type === "Card" && typeof value.id === "number";
}

export function CardElement(props: RenderElementProps) {
	return (
		<div {...props.attributes}>
			{props.children}
		</div>
	);
}

let lastCardId = 0;
export function newCardId(): number {
	lastCardId += 1;
	return lastCardId;
}

export function createTestCard(name: string = "Test Card", color: keyof typeof frameUrls = "red"): Card {
	return {
		type: "Card",
		id: newCardId(),
		children: [
			{ type: "Field", name: "name",        children: [{ type: "Paragraph", children: [{ text: name,               bold: false, italic: false }] }] },
			{ type: "Field", name: "frame",       children: [{ type: "Paragraph", children: [{ text: frameUrls[color],  bold: false, italic: false }] }] },
			{ type: "Field", name: "cost",        children: [{ type: "Paragraph", children: [{ text: "",                 bold: false, italic: false }] }] },
			{ type: "Field", name: "type",        children: [{ type: "Paragraph", children: [{ text: "Legendary Test",   bold: false, italic: false }] }] },

			{ type: "Field", name: "cardText",   children: [
				{ type: "Section", name: "rulesText", children: [{ type: "Paragraph", children: [{ text: "Rules are rules.", bold: false, italic: false }] }] },
				{ type: "HorizontalRule", children: [{ text: "" }] },
				{ type: "Section", name: "flavorText", children: [{ type: "Paragraph", children: [{ text: "Flavor is nice.", bold: false, italic: false }] }] },
			] },

			{ type: "Field", name: "pt",          children: [{ type: "Paragraph", children: [{ text: "2/2",              bold: false, italic: false }] }] },
			{ type: "Field", name: "image",       children: [{ type: "Image", src: undefined, children: [{ text: "" }] }] },
		]
	};
}
