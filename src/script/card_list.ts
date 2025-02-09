import { card_list_operation } from "./operation";
import { card } from "./card";
import { observable } from "./observable";

export interface card_list extends observable<card_list_operation> {
	id: string,
	cards: Set<card>,
}
