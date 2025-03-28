import { useState } from "react";
import { card_list } from "../../card_list";
import { card } from "../../card";
import { useObserver } from "./useObserver";

export function useCardListCards(list: card_list): Set<card> {
	const [_, setRefresh] = useState({}); // list.cards will always be the same Set object (and setting it to itself will skip rerendering) so we just set this dummy value to a new object with every operation
	useObserver(list, () => setRefresh({}), [list]);
	return list.cards;
}
