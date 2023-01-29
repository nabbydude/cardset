import "@saeris/typeface-beleren-bold"
import { create_test_card } from "./card";
import { card_editor, change_card, hydrate_card_editor } from "./card_editor";
import { card_list, hydrate_card_list, rebuild_card_list } from "./card_list";
import { card_list_columns } from "./magic_data";
import { init_undo_history } from "./undo_history";
import React from "react";
import { render } from "react-dom";
import { App } from "./components/App";

const card_editor_div = document.querySelector("div.card_editor") as HTMLDivElement;
const card_list_table = document.querySelector("table.card_list") as HTMLTableElement;

const test_cards = [
	create_test_card(),
	create_test_card(),
	create_test_card(),
];


// export const main_card_editor: card_editor = {
// 	card: test_cards[0],
// 	element: card_editor_div,
// };

// export const main_card_list: card_list = {
// 	columns: card_list_columns,
// 	cards: [...test_cards],
// 	selected_cards: new Set(),
// 	element: card_list_table,
// 	card_editor: main_card_editor,
// };

// init_undo_history();
// hydrate_card_editor(main_card_editor);
// hydrate_card_list(main_card_list);
// rebuild_card_list(main_card_list);

// change_card(main_card_editor, test_cards[0]);

const root_element = document.querySelector("#app");
render(<App/>, root_element);
