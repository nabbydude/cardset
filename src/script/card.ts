import { card_frame, frame_urls } from "./card_frame";
import { Card } from "./components/slate/Card";

let last_card_id = 0;
export function new_card_id(): number {
	last_card_id += 1;
	return last_card_id;
}

export const card_lookup = new Map<number, card>();

export interface card {
	id: number;
	frame: card_frame;
	markup: Card;
}

export function create_test_card(): card {
	const card: card = {
		id: new_card_id(),
		frame: { image: frame_urls.red },
		markup: {
			type: "Card",
			children: [
				{ type: "Field", name: "name",        children: [{ type: "Paragraph", children: [{ text: "Test Card",        bold: false, italic: false }] }] },
				{ type: "Field", name: "cost",        children: [{ type: "Paragraph", children: [{ text: "",                 bold: false, italic: false }] }] },
				{ type: "Field", name: "type",        children: [{ type: "Paragraph", children: [{ text: "Legendary Test",   bold: false, italic: false }] }] },
				{ type: "Field", name: "rules_text",  children: [{ type: "Paragraph", children: [{ text: "Rules are rules.", bold: false, italic: false }] }] },
				{ type: "Field", name: "flavor_text", children: [{ type: "Paragraph", children: [{ text: "Flavor is nice.",  bold: false, italic: false }] }] },
				{ type: "Field", name: "pt",          children: [{ type: "Paragraph", children: [{ text: "2/2",              bold: false, italic: false }] }] },
			]
		},
	};
	card_lookup.set(card.id, card);
	return card;
}
