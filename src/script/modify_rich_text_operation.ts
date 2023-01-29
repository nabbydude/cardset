import { card } from "./card";
import { operation_base, operation_type } from "./operation";
import { rich_text } from "./rich_text";
import { select_range } from "./util";

export interface modify_rich_text_operation extends operation_base {
	type: operation_type.modify_rich_text,
	card: card,
	field: rich_text,
	changes: change[],
	old_selection: StaticRange[],
	new_selection: StaticRange[],
}

export enum change_type {
	insert_node,
	move_node,
	remove_node,
	replace_text,
}

export interface change_base {
	type: change_type,
}

export interface move_node_change extends change_base {
	type: change_type.move_node,
	node: Node,
	old_parent: Node | null, // the old parent of the node, or null if it's newly created
	old_sibling: Node | null, // the old next sibling of the node, or null if its the last child
	new_parent: Node | null, // the new parent of the node, or null it's being removed
	new_sibling: Node | null, // the next sibling of the node, or null if its the last child
}

export interface replace_text_change extends change_base {
	type: change_type.replace_text,
	node: Node,
	old_text: string | null;
	new_text: string | null;
}

export type change = move_node_change | replace_text_change;

export function move_node_and_mark_change(node: Node, new_parent: Node | null, new_sibling: Node | null, operation: modify_rich_text_operation) {
	const old_parent = node.parentNode;
	const old_sibling = node.nextSibling;
	const change: move_node_change = {
		type: change_type.move_node,
		node,
		old_parent,
		old_sibling,
		new_parent,
		new_sibling,
	};
	do_move_node_change(change);
	operation.changes.push(change);
}

export function replace_text_and_mark_change(node: Node, new_text: string | null, operation: modify_rich_text_operation) {
	const change: replace_text_change = {
		type: change_type.replace_text,
		node,
		old_text: node.textContent,
		new_text,
	};
	do_replace_text_change(change);
	operation.changes.push(change);
}

export function set_and_mark_selection(range: StaticRange, operation: modify_rich_text_operation) {
	operation.new_selection[0] = range;
	select_range(document.getSelection()!, range);
}

function do_move_node_change(change: move_node_change) {
	if (change.new_parent !== null) {
		change.new_parent.insertBefore(change.node, change.new_sibling);
	} else if (change.old_parent !== null) {
		change.old_parent.removeChild(change.node);
	} else {
		console.warn("Attemmpt to do rich text change to move node from null to null");
	}
}

function undo_move_node_change(change: move_node_change) {
	if (change.old_parent !== null) {
		change.old_parent.insertBefore(change.node, change.old_sibling);
	} else if (change.new_parent !== null) {
		change.new_parent.removeChild(change.node);
	} else {
		console.warn("Attempt to undo rich text change to move node from null to null");
	}
}

function do_replace_text_change(change: replace_text_change) {
	change.node.textContent = change.new_text;
}

function undo_replace_text_change(change: replace_text_change) {
	change.node.textContent = change.old_text;
}

export function do_modify_text_operation(this: modify_rich_text_operation) {
	for (const change of this.changes) {
		switch (change.type) {
			case change_type.move_node: { do_move_node_change(change); break; }
			case change_type.replace_text: { do_replace_text_change(change); break; }
		}
	}
	const selection = document.getSelection();
	if (!selection) {
		console.warn("Failure to access selection to change it, cursor may be inaccurate.");
		return;
	}
	selection.removeAllRanges();
	for (const static_range of this.new_selection) {
		const range = new Range();
		range.setStart(static_range.startContainer, static_range.startOffset);
		range.setEnd(static_range.endContainer, static_range.endOffset);
		selection.addRange(range);
	}
}

export function undo_modify_text_operation(this: modify_rich_text_operation) {
	for (let i = this.changes.length - 1; i >= 0; i--) { // gotta undo in reverse order
		const change = this.changes[i];
		switch (change.type) {
			case change_type.move_node: { undo_move_node_change(change); break; }
			case change_type.replace_text: { undo_replace_text_change(change); break; }
		}
	}
	const selection = document.getSelection();
	if (!selection) {
		console.warn("Failure to access selection to change it, cursor may be inaccurate.");
		return;
	}
	selection.removeAllRanges();
	for (const static_range of this.old_selection) {
		const range = new Range();
		range.setStart(static_range.startContainer, static_range.startOffset);
		range.setEnd(static_range.endContainer, static_range.endOffset);
		selection.addRange(range);
	}
}

type create_modify_text_operation_partial = Partial<modify_rich_text_operation> & Pick<modify_rich_text_operation, "card" | "field">

export function create_modify_text_operation(partial: create_modify_text_operation_partial): modify_rich_text_operation {
	partial.type ??= operation_type.modify_rich_text;
	partial.explicit ??= true;
	partial.history_stop ??= true;
	partial.changes ??= [];
	partial.old_selection ??= [];
	partial.new_selection ??= [];
	partial.do ??= do_modify_text_operation;
	partial.undo ??= undo_modify_text_operation;
	return partial as modify_rich_text_operation;
}
