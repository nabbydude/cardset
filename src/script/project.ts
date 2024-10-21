import { card } from "./card";
import { focus } from "./focus";
import { history, write_history_step, write_operation_to_history } from "./history";

export interface project {
	name: string,
	cards: Record<string, card>,
}

export function add_card(project: project, history: history, focus: focus, card: card): card {
	project.cards[card.id] = card;
	write_operation_to_history(history, focus, { type: "add_card", card });
	return card;
}

export function delete_card(project: project, history: history, focus: focus, id: string) {
	write_operation_to_history(history, focus, { type: "add_card", card: project.cards[id] });
	delete project.cards[id];
}

export function delete_cards(project: project, history: history, focus: focus, ids: Iterable<string>) {
	for (const id of ids) delete_card(project, history, focus, id);
}
