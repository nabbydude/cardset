import { Selection } from "slate";
import { card } from "./card";
import { control, text_control } from "./control";

export interface base_focus {
	type: string,
}

export interface no_focus extends base_focus {
	type: "none",
}

export interface card_control_focus extends base_focus {
	type: "card_control",
	card: card,
	control: control,
}

export interface card_text_control_focus extends base_focus {
	type: "card_text_control",
	card: card,
	control: text_control,
	selection: Selection,
}

export type focus = (
	| no_focus
	| card_control_focus
	| card_text_control_focus
);
