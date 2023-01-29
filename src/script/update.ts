import { update_card } from "./card_list";
import { main_card_list } from "./main";

export function update_secondaries() {
	if (main_card_list.active_card) update_card(main_card_list, main_card_list.active_card);
}
