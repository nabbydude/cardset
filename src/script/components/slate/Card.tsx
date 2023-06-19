import React from "react";
import { BaseElement, Element } from "slate";
import { RenderElementProps } from "slate-react";
import { Field } from "./Field";
import { frame_urls } from "../../color_assets";

export interface Card extends BaseElement {
	type: "Card",
	id: number,
	children: Field[],
}

export function isCard(value: any): value is Card {
	return Element.isElement(value) && value.type === "Card" && typeof value.id === "number";
}


export function CardElement(props: RenderElementProps) {
	return (
		<div {...props.attributes}>
			{props.children}
		</div>
	)
}

let last_card_id = 0;
export function new_card_id(): number {
	last_card_id += 1;
	return last_card_id;
}

export function create_test_card(name: string = "Test Card", color: keyof typeof frame_urls = "red"): Card {
	return {
		type: "Card",
		id: new_card_id(),
		children: [
			{ type: "Field", name: "name",        children: [{ type: "Paragraph", children: [{ text: name,               bold: false, italic: false }] }] },
			{ type: "Field", name: "frame",       children: [{ type: "Paragraph", children: [{ text: frame_urls[color],  bold: false, italic: false }] }] },
			{ type: "Field", name: "cost",        children: [{ type: "Paragraph", children: [{ text: "",                 bold: false, italic: false }] }] },
			{ type: "Field", name: "type",        children: [{ type: "Paragraph", children: [{ text: "Legendary Test",   bold: false, italic: false }] }] },

			{ type: "Field", name: "card_text",   children: [
				{ type: "Section", name: "rules_text", children: [{ type: "Paragraph", children: [{ text: "Rules are rules.", bold: false, italic: false }] }] },
				{ type: "HorizontalRule", children: [{ text: "" }] },
				{ type: "Section", name: "flavor_text", children: [{ type: "Paragraph", children: [{ text: "Flavor is nice.", bold: false, italic: false }] }] },
			] },

			{ type: "Field", name: "pt",          children: [{ type: "Paragraph", children: [{ text: "2/2",              bold: false, italic: false }] }] },
			{ type: "Field", name: "image",       children: [{ type: "Image", src: null, children: [{ text: "" }] }] },
		]
	};
}
