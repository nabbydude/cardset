import { Path, Operation as SlateOperation } from 'slate'
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
	allow_writing: boolean,
	force_merging: boolean,
	allow_merging: boolean,
	disable_next_merge: boolean,
}

export function new_history(): history {
	return {
		index: 0,
		steps: [],
		allow_writing: true,
		allow_merging: false,
		force_merging: false,
		disable_next_merge: false
	};
}

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
	if (!history.allow_writing) return;
	history.steps.splice(history.index, history.steps.length - history.index, step);
	history.index++;
	while (history.steps.length > MAX_HISTORY_STEPS) {
		unload_history_step(history.steps.shift()!);
		history.index--;
	};
}

export function unload_history_step(step: history_step) {
	for (const op of step.operations) {
		if (op.type === "change_property_value") {
			if (op.property.type === "image") { // note this checks the current property type. gets weird if we ever allow changing property types at runtime (in that case we should just unload on that type change)
				if (op.old_value) unload_image(op.old_value as image);
			}
		}
	}
}

export function write_operation_to_history(history: history, focus: focus, op: operation, force_merging_once: boolean = false) {
	if (!history.allow_writing) return;
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

export function undo(history: history, focus_callback?: (focus: focus) => void) {
	const { index, steps } = history;
	if (index <= 0) return;
	const { operations, focus_before } = steps[index - 1];
	const reversed_operations = operations.map(get_inverse).reverse();
	for (const op of reversed_operations) apply_operation(op);
	focus_callback?.(focus_before);
	history.index--;
}

export function redo(history: history, focus_callback?: (focus: focus) => void) {
	const { index, steps } = history;
	if (index >= steps.length) return;
	const { operations, focus_before } = steps[index];
	focus_callback?.(focus_before);
	for (const op of operations) apply_operation(op);
	history.index++;
}

export function batch_in_history(history: history, callback: () => void) {
	const upper_force = history.force_merging;

	if (!upper_force) history.disable_next_merge = true;
	history.force_merging = true;
	callback();
	history.force_merging = upper_force;
}

export function without_writing_history(history: history, callback: () => void) {
	const upper_write = history.allow_writing;
	history.allow_writing = false;
	callback();
	history.allow_writing = upper_write;
}
