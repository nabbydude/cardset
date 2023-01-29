import { is_block_node, remove_range, replace_range_with_node, replace_range_with_text, wrap_range } from "./rich_text_util";
import { create_modify_text_operation, set_and_mark_selection } from "./modify_rich_text_operation";
import { undo_history } from "./undo_history";
import { create_mana_symbol } from "./magic_rich_text_util";
import { card, card_field_id, card_lookup } from "./card";
import { rich_text } from "./rich_text";
import { collapsed_to_end, collapsed_to_start, current_selection } from "./util";

export type input_type = (
	| "insertReplacementText"
	| "insertText"
	| "insertParagraph"
	| "insertLineBreak"
	| "deleteContentBackward"
	| "deleteContentForward"
	| "deleteWordBackward"
	| "deleteWordForward"
	| "formatBold"
	| "formatItalic"
);

export type input_event_map = {
	[t in input_type]: (e: InputEvent, card: card, field: rich_text) => void;
};

export const default_input_event_map: input_event_map = {
	"insertReplacementText": default_insert_text,
	"insertText": default_insert_text,
	
	"insertParagraph": default_insert_paragraph,
	"insertLineBreak": default_insert_line_break,
	
	"deleteContentBackward": default_delete_content,
	"deleteContentForward": default_delete_content,
	"deleteWordBackward": default_delete_content,
	"deleteWordForward": default_delete_content,

	"formatBold": default_format_bold,
	"formatItalic": default_format_italic,
}

export const mana_input_event_map: input_event_map = {
	...default_input_event_map,
	"insertReplacementText": mana_insert_text,
	"insertText": mana_insert_text,

	"formatBold": do_nothing,
	"formatItalic": do_nothing,
}

export function do_nothing() {
	// effectively disables the event
}

export function do_input_event(e: InputEvent, event_map: input_event_map) {
	console.log(e);
	console.log(e.getTargetRanges()[0]);
	console.log(new StaticRange(document.getSelection()!.getRangeAt(0)));

	const input_event = event_map[e.inputType as input_type];
	if (input_event) {
		const root = e.currentTarget as HTMLElement;
		const card_id = parseInt((root.closest("[data-card]") as HTMLElement)?.dataset.card as string);
		const card = card_lookup.get(card_id);
		if (!card) {
			console.error("Failed to find parent card for node:", e.currentTarget);
			return;
		}
		const field_id = root.dataset.field as card_field_id | undefined;
		if (!field_id) {
			console.error("Failed to find parent field for node:", e.currentTarget);
			return;
		}
		const field = card[field_id];
		e.preventDefault();
		input_event(e, card, field);
		field.nodes = [...root.childNodes]; // todo, handle this in a more robust and ideally less wasteful way
	}
}

function default_insert_text(e: InputEvent, card: card, field: rich_text) {
	if (e.data === null) throw Error("event data shouldnt be null");
	const operation = create_modify_text_operation({ card, field, old_selection: current_selection() });

	const range = replace_range_with_text(e.getTargetRanges()[0], e.data, operation);

	set_and_mark_selection(collapsed_to_end(range), operation);
	undo_history.register_operation(operation);
}

function default_insert_paragraph(e: InputEvent, card: card, field: rich_text) {
	const operation = create_modify_text_operation({ card, field, old_selection: current_selection() });

	const range = replace_range_with_node(e.getTargetRanges()[0], document.createElement("br"), operation);

	set_and_mark_selection(collapsed_to_end(range), operation);
	undo_history.register_operation(operation);
}

function default_insert_line_break(e: InputEvent, card: card, field: rich_text) {
	const operation = create_modify_text_operation({ card, field, old_selection: current_selection() });

	const range = replace_range_with_node(e.getTargetRanges()[0], document.createElement("br"), operation);

	set_and_mark_selection(collapsed_to_end(range), operation);
	undo_history.register_operation(operation);
}

function default_delete_content(e: InputEvent, card: card, field: rich_text) {
	const operation = create_modify_text_operation({ card, field, old_selection: current_selection() });

	const range = remove_range(e.getTargetRanges()[0], operation);

	set_and_mark_selection(collapsed_to_start(range), operation);
	undo_history.register_operation(operation);
}

function default_format_bold(e: InputEvent, card: card, field: rich_text) {
	const operation = create_modify_text_operation({ card, field, old_selection: current_selection() });

	const range = wrap_range(e.getTargetRanges()[0], () => document.createElement("b"), node => !is_block_node(node), operation);
	// todo: unwrap

	set_and_mark_selection(range, operation);
	undo_history.register_operation(operation);
}

function default_format_italic(e: InputEvent, card: card, field: rich_text) {
	const operation = create_modify_text_operation({ card, field, old_selection: current_selection() });

	let range = wrap_range(e.getTargetRanges()[0], () => document.createElement("i"), node => !is_block_node(node), operation);
	// todo: unwrap

	set_and_mark_selection(range, operation);
	undo_history.register_operation(operation);
}

function mana_insert_text(e: InputEvent, card: card, field: rich_text) {
	if (e.data === null) throw Error("e.data shouldnt be null");
	const operation = create_modify_text_operation({ card, field, old_selection: current_selection() });

	const range = replace_range_with_node(e.getTargetRanges()[0], create_mana_symbol(e.data), operation);
	
	set_and_mark_selection(collapsed_to_end(range), operation);
	undo_history.register_operation(operation);
}
