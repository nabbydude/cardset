// import "@saeris/typeface-beleren-bold"
import { create_test_card } from "./card";
import { createRoot } from "react-dom/client";
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
const root = createRoot(root_element!);
root.render(App());
