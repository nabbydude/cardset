import { useEffect, useState } from "react";
import { allowed_observer_for, observe, unobserve } from "../../observable";
import { card_list } from "../../card_list";
import { card } from "../../card";

export function useCardListCards(list: card_list): Set<card> {
	const [_, setRefresh] = useState({}); // list.cards will always be the same Set object (and setting it to itself will skip rerendering) so we just set this dummy value to a new object with every operation

	useEffect(() => {
		const observer: allowed_observer_for<card_list> = () => setRefresh({});
		observe(list, observer);
		return () => unobserve(list, observer);
	}, [list]);

	return list.cards;
}
