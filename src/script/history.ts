import { Editor, Path, Operation as SlateOperation } from 'slate'
import { BaseCardTextControlEditor } from './slate';
import { apply_operation, get_inverse, operation } from './operation';
import { focus } from './focus';
import { image, unload_image } from './image';


const MAX_HISTORY_STEPS = 100;

interface history_step {
	operations: operation[],
	focus_before: focus,
}

export interface history {
	steps: history_step[],
	index: number,
	force_merging: boolean,
	allow_merging: boolean,
	disable_next_merge: boolean,
}

export interface SharedHistoryEditor extends Editor {
	history: history,
	write_history: boolean,
}

// export function withSharedHistory<T extends BaseCardTextControlEditor>(editor: T, history: history): T & SharedHistoryEditor {
// 	const e = editor as T & SharedHistoryEditor
// 	const { apply } = e

// 	e.history = history;
// 	e.write_history = true;

// 	e.apply = (slate_operation: SlateOperation) => {
// 		const { operations, history, write_history, card, control_id, property, selection } = e;

// 		if (write_history && slate_operation.type !== "set_selection") {
// 			write_operation_to_history(
// 				history,
// 				{ type: "card_text_control", card: card!, control_id, selection }, // todo: type safety on undefined
// 				{ type: "modify_property_text", property, operation: slate_operation },
// 				operations.length !== 0
// 			);
// 			history.allow_merging = true;
// 		}

// 		apply(slate_operation);
// 	}

// 	return e;
// }

/**
 * Check whether to merge an operation into the previous operation.
 */
function should_merge(op: operation, prev: operation | undefined): boolean {
	if (!prev) return false;
	if (
		op.type === "modify_property_text" &&
		prev.type === "modify_property_text" &&
		op.property === prev.property
	) {
		return should_merge_slate(op.operation, prev.operation);
	}
	return false;
}

/**
 * Check whether to merge a Slate operation into the previous operation.
 */
function should_merge_slate(op: SlateOperation, prev: SlateOperation | undefined): boolean {
	if (!prev) return false;
	if (
		op.type === "insert_text" && 
		prev.type === "insert_text" &&
		op.offset === prev.offset + prev.text.length &&
		Path.equals(op.path, prev.path)
	) {
		return true;
	}

	if (
		op.type === "remove_text" &&
		prev.type === "remove_text" &&
		op.offset + op.text.length === prev.offset &&
		Path.equals(op.path, prev.path)
	) {
		return true;
	}
	return false;
}

export function write_history_step(history: history, step: history_step) {
	history.steps.splice(history.index, history.steps.length - history.index, step);
	history.index++;
	while (history.steps.length > MAX_HISTORY_STEPS) {
		const step = history.steps.shift();
		for (const op of step!.operations) {
			if (op.type === "change_property_value") {
				if (op.property.type === "image") { // note this checks the current property type. gets weid if we ever allow changing property types at runtime
					unload_image(op.old_value as image);
				}
			}
		}
		history.index--;
	};
}

export function write_operation_to_history(history: history, focus: focus, op: operation, force_merging_once: boolean = false) {
	const { steps, index, allow_merging, force_merging, disable_next_merge } = history;
	const next_step = steps[index];
	const previous_step = index > 0 ? steps[index - 1] : undefined;

	const previous_op = previous_step?.operations[previous_step.operations.length - 1];
	const merge = !disable_next_merge && previous_step && !next_step && (force_merging || force_merging_once || (allow_merging && should_merge(op, previous_op)));

	if (merge) {
		previous_step.operations.push(op);
	} else {
		write_history_step(history, {
			operations: [op],
			focus_before: focus,
		});
	}
	history.disable_next_merge = false;
}

export function apply_and_write(history: history, focus: focus, op: operation, force_merging_once: boolean = false) {
	apply_operation(op);
	write_operation_to_history(history, focus, op, force_merging_once);
}

export function undo(history: history) {
	const { index, steps } = history;
	if (index <= 0) return;
	const { operations } = steps[index - 1];
	const reversed_operations = operations.map(get_inverse).reverse();
	for (const op of reversed_operations) {
		apply_operation(op);
	}
	// do focus_before

	history.index--;
}

export function redo(history: history) {
	const { index, steps } = history;
	if (index >= steps.length) return;
	const { operations } = steps[index];
	// do focus_before
	for (const op of operations) {
		apply_operation(op);
	}

	history.index++;
}

export function batch_in_history(history: history, callback: () => void) {
	const upper_force = history.force_merging;

	if (!upper_force) history.disable_next_merge = true;
	history.force_merging = true;
	callback();
	history.force_merging = upper_force;
}

export function without_writing_history(editor: SharedHistoryEditor, callback: () => void) {
	const upper_write = editor.write_history;
	editor.write_history = false;
	callback();
	editor.write_history = upper_write;
}
