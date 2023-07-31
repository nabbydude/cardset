import { Editor, Node, NodeEntry, Text } from "slate";
import { colorNamesByLetter } from "./assets";
import { createGenericPip, createManaPipFromLetter } from "./components/TextField";
import { MultiEditor, ViewEditor } from "./multiSlate";
import { HistoryEditor } from "slate-history";

interface RegExpExecArray extends globalThis.RegExpExecArray {
	indices: [number, number][], // this is a relatively recent feature availiable in all modern browsers, just not in typescript at time of writing
}

export interface Replacement {
	pattern: RegExp,
	substitute: string | Node | Node[] | ((match: RegExpExecArray) => string | Node | Node[]);
}

export const replacements: Replacement[] = [
	{ pattern: /--| - /d, substitute: "\u2014" },
	{ pattern: /{(?<letter>[WUBRGC])}/d, substitute: m => [createManaPipFromLetter(m.groups!.letter as keyof typeof colorNamesByLetter), { text: "" }] },
	{ pattern: /{(?<digits>\d+)}/d, substitute: m => [createGenericPip(m.groups!.digits), { text: "" }] },
];

export function doAutoReplace(editor: Editor) {
	if (!editor.selection) return;
	const [node, path] = editor.node(editor.selection.focus) as NodeEntry<Text>;
	const offset = editor.selection.focus.offset;
	for (const { pattern, substitute } of replacements) {
		const m = pattern.exec(node.text) as RegExpExecArray;
		if (!m) continue;
		const [start, end] = m.indices[0];

		if (!(offset >= start && offset <= end)) continue;

		const doc = (editor as ViewEditor).viewParent.editor as MultiEditor & HistoryEditor;

		// force a new undo step 
		doc.writeHistory("undos", { operations: [], selectionBefore: doc.selection });

		const resolved = substitute instanceof Function ? substitute(m) : substitute;
		const insertable = (typeof resolved === "string") ? { text: resolved } : resolved;

		editor.insertNodes(insertable, {
			at: {
				anchor: { path, offset: start },
				focus: { path, offset: end },
			},
			select: true,
		});
		return;
	}
}
