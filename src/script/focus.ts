import { Selection } from "slate";
import { card } from "./card";

export interface base_focus {
	type: string,
}

export interface no_focus extends base_focus {
	type: "none",
}

export interface card_text_control_focus extends base_focus {
	type: "card_text_control",
	card: card,
	control_id: string,
	selection: Selection,
}

export type focus = (
	| no_focus
	| card_text_control_focus
);
