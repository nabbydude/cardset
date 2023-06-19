import React, { KeyboardEvent, useCallback } from "react";
import { Editor, Node, Text, Transforms } from "slate";
import { ReactEditor } from "slate-react";
import { isManaPip } from "./slate/ManaPip";
import { color_names_by_letter, symbol_urls } from "../color_assets";
import { TextField, TextFieldProps } from "./TextField";

export interface ManaTextFieldProps extends TextFieldProps {

}

export function ManaTextField(props: ManaTextFieldProps) {
	const { onEditableDOMBeforeInput, ...rest } = props;
	return (
		<TextField
			onEditableDOMBeforeInput={useCallback((e: InputEvent, editor: ReactEditor) => { if(onEditableDOMBeforeInput) onEditableDOMBeforeInput(e, editor); if(!e.defaultPrevented) onDOMBeforeInput(e, editor); }, [onEditableDOMBeforeInput])}
			{...rest}
		/>
	)
}

function onDOMBeforeInput(e: InputEvent, editor: ReactEditor) {
	switch (e.inputType) {
		case "insertText": return onInsertText(e, editor);
	}
}

function onInsertText(e: InputEvent, editor: ReactEditor) {
	if (!(editor.selection && e.data)) return;
	const closest_pip_entry = Editor.above(editor, {
		match: node => isManaPip(node),
		at: editor.selection,
	});
	if (closest_pip_entry) {
		if (/[0-9]/.test(e.data)) return;
		Transforms.splitNodes(editor, { match: (node, path) => isManaPip(node) });
		const point = editor.start(editor.selection);
		let closest_non_pip_entry;
		if (editor.isEnd(point, point.path)) {
			closest_non_pip_entry = editor.next({ at: editor.selection, match: (node, path) => Text.isText(node) && !isManaPip(Node.parent(editor, path)) });
		} else {
			closest_non_pip_entry = editor.previous({ at: editor.selection, match: (node, path) => Text.isText(node) && !isManaPip(Node.parent(editor, path)) });
		}
		if (!closest_non_pip_entry) throw Error("closest_non_pip_entry not found. are we not in an inline? there should be one after normalizing");
		const [node, path] = closest_non_pip_entry;
		editor.select(editor.start(path));
	}

	e.preventDefault();

	if (/[0-9]/.test(e.data)) {
		Editor.insertNode(editor, {
			type: "ManaPip",
			color: "var(--generic-mana-background-color)",
			children: [{ text: e.data }],
		});
	} else if (/[WUBRGC]/i.test(e.data)) {
		const letter = e.data.toUpperCase() as keyof typeof color_names_by_letter;
		const color = color_names_by_letter[letter];
		Editor.insertNode(editor, {
			type: "ManaPip",
			color: `var(--${color}-mana-background-color)`,
			children: [{ type: "Symbol", src: symbol_urls[color], alt: letter, children: [{ text: "" }] }],
		});
		// // move outside of node
		// const new_closest_pip_entry = Editor.above(editor, {
		// 	match: node => isManaPip(node),
		// 	at: editor.selection,
		// });
		// if (!new_closest_pip_entry) {
		// 	console.warn("Can't find pip we just created. Did it get normalized away? Failing gracefully");
		// 	return;
		// }
		// const [, path] = new_closest_pip_entry;
		// const point = Editor.after(editor, path)!;
		// Transforms.setSelection(editor, { focus: point, anchor: point });
	}
}
