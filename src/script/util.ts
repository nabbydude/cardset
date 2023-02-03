let last_card_id = 0
export function new_card_id(): number {
	last_card_id += 1;
	return last_card_id;
}
