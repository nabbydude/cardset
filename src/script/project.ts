import { card } from "./card";
import { card_list } from "./card_list";
import { focus } from "./focus";
import { apply_and_write, batch_in_history, history } from "./history";

export interface project {
	name: string,
	card_list: card_list,
}

export function add_card(project: project, history: history, focus: focus, card: card): card {
	apply_and_write(history, focus, { type: "add_card_to_list", card, list: project.card_list });
	return card;
}

export function delete_card(project: project, history: history, focus: focus, card: card) {
	apply_and_write(history, focus, { type: "remove_card_from_list", card, list: project.card_list });
}

export function delete_cards(project: project, history: history, focus: focus, cards: Iterable<card>) {
	batch_in_history(history, () => {
		for (const card of cards) delete_card(project, history, focus, card);
	});
}
