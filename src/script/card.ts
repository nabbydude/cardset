import { card_frame, frame_urls } from "./card_frame";
import { create_rich_text_value_from_plain_text, rich_text_value } from "./rich_text_value";

export type card_field_id = {
	[K in keyof card]: card[K] extends rich_text_value ? K : never;
}[keyof card];

let last_card_id = 0;
export function new_card_id(): number {
	last_card_id += 1;
	return last_card_id;
}

export const card_lookup = new Map<number, card>();

export interface card {
	id: number;
	name: rich_text_value;
	type: rich_text_value;
	cost: rich_text_value;
	rules_text: rich_text_value;
	flavor_text: rich_text_value;
	pt: rich_text_value;
	frame: card_frame;
}

export function create_test_card(): card {
	const card = {
		id: new_card_id(),
		name: create_rich_text_value_from_plain_text("Test Card"),
		type: create_rich_text_value_from_plain_text("Legendary Test"),
		cost: create_rich_text_value_from_plain_text(""),
		rules_text: create_rich_text_value_from_plain_text("<p>Rules are rules.</p>"),
		flavor_text: create_rich_text_value_from_plain_text("<p>Flavor is nice.</p>"),
		pt: create_rich_text_value_from_plain_text(""),
		frame: { image: frame_urls.red },
	};
	card_lookup.set(card.id, card);
	return card;
}
