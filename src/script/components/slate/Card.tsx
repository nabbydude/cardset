import React from "react";
import { BaseElement, Element } from "slate";
import { RenderElementProps } from "slate-react";
import { Field } from "./Field";
import { frameUrls, ptBoxUrls } from "../../assets";

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
export function setCardId(value: number = 0) {
	lastCardId = value;
}

export function newCardId(): number {
	lastCardId += 1;
	return lastCardId;
}

export function createTestCard(name: string = "Test Card", color: keyof typeof frameUrls & keyof typeof ptBoxUrls = "red"): Card {
	return {
		type: "Card",
		id: newCardId(),
		children: [
			{ type: "Field", name: "name",  children: [{ type: "Paragraph", children: [{ text: name,            }] }] },
			{ type: "Field", name: "frame", children: [{ type: "Image", src: frameUrls[color], children: [{ text: "" }] }] },
			{ type: "Field", name: "cost",  children: [{ type: "Paragraph", children: [{ text: "",              }] }] },
			{ type: "Field", name: "type",  children: [{ type: "Paragraph", children: [{ text: "Legendary Test" }] }] },

			{ type: "Field", name: "cardText", children: [
				{ type: "Section", name: "rulesText", children: [{ type: "Paragraph", children: [{ text: "Rules are rules." }] }] },
				{ type: "HorizontalRule", children: [{ text: "" }] },
				{ type: "Section", name: "flavorText", children: [{ type: "Paragraph", children: [{ text: "Flavor is nice." }] }] },
			] },

			{ type: "Field", name: "pt", children: [{ type: "Paragraph", children: [{ text: "2/2" }] }] },
			{ type: "Field", name: "ptBox", children: [{ type: "Image", src: ptBoxUrls[color], children: [{ text: "" }] }] },
			{ type: "Field", name: "image", children: [{ type: "Image", src: undefined, children: [{ text: "" }] }] },
		]
	};
}
