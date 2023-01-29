import { operation } from "./operation";

export function init_undo_history() {
	document.addEventListener("keydown", history_hotkey_handler);
}

export const undo_history = {
	operations: [] as operation[],
	index: 0,
	register_operation(operation: operation) {
		this.operations.splice(this.index, this.operations.length - this.index, operation);
		this.index += 1;
	},
	undo() {
		if (this.index == 0) return;
		this.index -= 1;
		this.operations[this.index].undo();
	},
	redo() {
		if (this.index == this.operations.length) return;
		this.operations[this.index].do();
		this.index += 1;
	},	
};

function history_hotkey_handler(e: KeyboardEvent) {
	if (!e.ctrlKey || e.key.toLowerCase() !== "z") return;
	e.preventDefault();
	if (e.shiftKey) {
		undo_history.redo();
	} else {
		undo_history.undo();
	}
}
