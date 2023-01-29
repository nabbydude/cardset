import { card_frame, frame_urls } from "./card_frame";
import { create_rich_text_from_markup, rich_text } from "./rich_text";
import { new_card_id } from "./util";

export type card_field_id = {
	[K in keyof card]: card[K] extends rich_text ? K : never;
}[keyof card];

export interface card {
	id: number;
	name: rich_text;
	type: rich_text;
	cost: rich_text;
	rules_text: rich_text;
	flavor_text: rich_text;
	pt: rich_text;
	frame: card_frame;
}

export const card_lookup = new Map<number, card>();

export function create_test_card(): card {
	const card = {
		id: new_card_id(),
		name: create_rich_text_from_markup("Test Card"),
		type: create_rich_text_from_markup("Legendary Test"),
		cost: create_rich_text_from_markup(""),
		rules_text: create_rich_text_from_markup("<p>Rules are rules.</p>"),
		flavor_text: create_rich_text_from_markup("<p>Flavor is nice.</p>"),
		pt: create_rich_text_from_markup(""),
		frame: { image: frame_urls.red },
	};
	card_lookup.set(card.id, card);
	return card;
}
