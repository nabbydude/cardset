import { Editor, Path, Operation as SlateOperation } from 'slate'
import { CardTextControlEditor } from './slate';
import { project } from './project';
import { apply, get_inverse, operation } from './operation';
import { focus } from './focus';


const MAX_HISTORY_STEPS = 100;

interface history_step {
	operations: operation[],
	focus_before: focus,
}

export interface history {
	steps: history_step[],
	index: number,
	force_merging: boolean;
	allow_merging: boolean;
	disable_next_merge: boolean;
}

export interface SharedHistoryEditor extends Editor {
	history: history,
}

export function withSharedHistory<T extends CardTextControlEditor>(editor: T, history: history): T & SharedHistoryEditor {
	const e = editor as T & SharedHistoryEditor
	const { apply } = e

	e.history = history;

	e.apply = (slate_operation: SlateOperation) => {
		const { operations, history, card_id, control_id, property_id, selection } = e;

		if (slate_operation.type !== "set_selection") {
			write_operation_to_history(
				history,
				{ type: "card_text_control", card_id, control_id, selection },
				{ type: "text_property", card_id, property_id, operation: slate_operation },
				operations.length !== 0
			);
			history.allow_merging = true;
		}

		apply(slate_operation);
	}

	return e;
}

/**
 * Check whether to merge an operation into the previous operation.
 */
function should_merge(op: operation, prev: operation | undefined): boolean {
	if (!prev) return false;
	if (
		op.type === "text_property" &&
		prev.type === "text_property" &&
		op.card_id === prev.card_id &&
		op.property_id === prev.property_id
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
		history.steps.shift();
		history.index--;
	};
}

export function write_operation_to_history(history: history, focus: focus, op: operation, force_merging_once: boolean = false) {
	const { steps, index, allow_merging, force_merging, disable_next_merge } = history;
	const current_step = steps[index];
	const previous_step = index > 0 ? steps[index - 1] : undefined;

	const previous_op = previous_step?.operations[previous_step.operations.length - 1];
	const merge = !disable_next_merge && previous_step && !current_step && (force_merging || force_merging_once || (allow_merging || should_merge(op, previous_op)));

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

export function undo(project: project, history: history) {
	const { index, steps } = history;
	if (index <= 0) return;
	const { operations, focus_before } = steps[index - 1];
	const reversed_operations = operations.map(get_inverse).reverse();
	for (const op of reversed_operations) {
		apply(project, op);
	}
	// do focus_before

	history.index++;
}

export function redo(project: project, history: history) {
	const { index, steps } = history;
	if (index >= steps.length) return;
	const { operations, focus_before } = steps[index];
	// do focus_before
	for (const op of operations) {
		apply(project, op);
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
