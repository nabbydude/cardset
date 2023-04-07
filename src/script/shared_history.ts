/*
	Portions of the code in this file is derived from the slate-history section of the slate repo at https://github.com/ianstormtaylor/slate
	The license for that code is included below:

	The MIT License

	Copyright &copy; 2016–2023, [Ian Storm Taylor](https://ianstormtaylor.com)

	Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

import { createContext, useContext } from "react"
import { InsertTextOperation, Operation, Path, Range, RemoveTextOperation } from "slate";
import { card } from "./card";

export interface history {
	steps: history_step[],
	index: number,
}

export type app_operation = rich_text_operation;

export interface rich_text_operation {
	type: "rich_text_operation",
	card: card,
	field: string,
	slate_operation: Operation,
}

interface history_step {
	operations: app_operation[],
	focusBefore: focus,
	can_merge: boolean;
}

type focus = card_field_focus;

interface card_field_focus {
	card: card,
	field: string,
	selection: Range | null,
}

export const SharedHistoryContext = createContext<history>({
	steps: [],
	index: 0,
});

// export const useSharedHistory = (): history => {
// 	const context = useContext(SharedHistoryContext);

// 	const { editor } = context
// 	return editor
// }

function undo(history: history) {
	if (history.index <= 0) return;
	const step = history.steps[history.index - 1];
	step
}

function should_merge_operation(op: app_operation, prev: app_operation | undefined): boolean {
	if (
		prev && op.type === prev.type && op.slate_operation.type === prev.slate_operation.type && (
			(op.slate_operation.type === "insert_text" && op.slate_operation.offset === (prev.slate_operation as InsertTextOperation).offset + (prev.slate_operation as InsertTextOperation).text.length) ||
			(op.slate_operation.type === "remove_text" && op.slate_operation.offset + op.slate_operation.text.length === (prev.slate_operation as RemoveTextOperation).offset)
		) && Path.equals(op.slate_operation.path, (prev.slate_operation as InsertTextOperation | RemoveTextOperation).path)
	) {
		return true;
	}

	return false;
}
