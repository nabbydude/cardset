// import { card, card_field_id, card_lookup } from "./card";
// import { card_editor, change_card } from "./card_editor";

// export interface card_list {
// 	columns: card_field_id[];
// 	cards: card[],
// 	selected_cards: Set<number>, // ids of selected cards
// 	active_card?: number,
// 	element: HTMLTableElement,
// 	card_editor?: card_editor,
// }

// export function hydrate_card_list(card_list: card_list) {
// 	document.addEventListener("card_field_update", e => on_card_field_update(e as CustomEvent, card_list))

// 	const tbody = card_list.element.querySelector("tbody") as HTMLTableSectionElement;

// 	tbody.addEventListener("mousedown", e => on_tbody_mousedown(e, card_list));
// }

// export function rebuild_card_list(card_list: card_list) {
// 	const body = card_list.element.querySelector("tbody") as HTMLTableSectionElement;

// 	const rows = card_list.cards.map(card => {
// 		const row = document.createElement("tr");
// 		row.dataset.card = String(card.id);
// 		row.replaceChildren(...card_list.columns.map(field => {
// 			const cell = document.createElement("td");
// 			cell.dataset.field = field;
// 			cell.replaceChildren(...card[field].nodes.map(node => node.cloneNode(true)));
// 			return cell;
// 		}));
// 		return row;
// 	});

// 	body.replaceChildren(...rows);
// }

// export function update_card_field(card_list: card_list, card: card, field: card_field_id) {
// 	const cell = card_list.element.querySelector(`tbody>tr[data-card="${card.id}"]>td[data-field="${field}"]`) as HTMLTableCellElement;
// 	if (!cell) return; // should we precheck and bail before checking tree?
// 	cell.replaceChildren(...card[field].nodes.map(node => node.cloneNode(true)));
// }


// /** update which rows are showing as active and selected */
// export function update_highlighting(card_list: card_list) {
// 	const rows = card_list.element.querySelectorAll("tbody>tr") as NodeListOf<HTMLTableRowElement>;
// 	for (const row of rows) {
// 		const id = Number(row.dataset.card);
// 		if (row.dataset.card && card_list.active_card === id) {
// 			row.classList.add("active");
// 		} else {
// 			row.classList.remove("active");
// 		}
// 		if (row.dataset.card && card_list.selected_cards.has(id)) {
// 			row.classList.add("selected");
// 		} else {
// 			row.classList.remove("selected");
// 		}
// 	}
// 	const card = card_list.cards.find(v => v.id === card_list.active_card);
// 	if (card && card_list.card_editor) change_card(card_list.card_editor, card);
// }

// function on_card_field_update(e: CustomEvent, card_list: card_list) {
// 	update_card_field(card_list, e.detail.card, e.detail.field);
// }

// function on_tbody_mousedown(e: MouseEvent, card_list: card_list) {
// 	if (!(e.target instanceof Node)) throw Error("Clicking on a non-node?");
// 	const row = (e.target instanceof Element ? e.target : e.target.parentElement)?.closest("tr");
// 	if (!row || !row.dataset.card) return;

// 	if (!e.ctrlKey) card_list.selected_cards.clear();
// 	const id = Number(row.dataset.card);
// 	card_list.active_card = id;
// 	card_list.selected_cards.add(id);
// 	// card_list.
// 	update_highlighting(card_list);
// }

// function on_tbody_click(e: MouseEvent, card_list: card_list) {
// 	if (!(e.target instanceof Node)) throw Error("Clicking on a non-node?");
// 	const row = (e.target instanceof Element ? e.target : e.target.parentElement)?.closest("tr");
// 	if (!row || !row.dataset.card) return;

// 	if (!e.ctrlKey) card_list.selected_cards.clear();
// 	const id = Number(row.dataset.card);
// 	card_list.active_card = id;
// 	card_list.selected_cards.add(id);
// 	update_highlighting(card_list);
// }
