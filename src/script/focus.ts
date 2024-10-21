import { Selection } from "slate";

export interface base_focus {
	type: string,
}

export interface no_focus extends base_focus {
	type: "none",
}

export interface card_text_control_focus extends base_focus {
	type: "card_text_control",
	card_id: string,
	control_id: string,
	selection: Selection,
}

export type focus = (
	| no_focus
	| card_text_control_focus
);
