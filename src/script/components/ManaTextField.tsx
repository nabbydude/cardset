import React, { useCallback } from "react";
import { Editor, Node, Text, Transforms } from "slate";
import { ReactEditor } from "slate-react";
import { isManaPip } from "./slate/ManaPip";
import { colorNamesByLetter, iconUrls } from "../colorAssets";
import { TextField, TextFieldProps } from "./TextField";

// export interface ManaTextFieldProps extends TextFieldProps {

// }

export function ManaTextField(props: TextFieldProps) {
	const { onEditableDOMBeforeInput, ...rest } = props;
	return (
		<TextField
			onEditableDOMBeforeInput={useCallback((e: InputEvent, editor: ReactEditor) => { if(onEditableDOMBeforeInput) onEditableDOMBeforeInput(e, editor); if(!e.defaultPrevented) onDOMBeforeInput(e, editor); }, [onEditableDOMBeforeInput])}
			{...rest}
		/>
	);
}

function onDOMBeforeInput(e: InputEvent, editor: ReactEditor) {
	switch (e.inputType) {
		case "insertText": return onInsertText(e, editor);
	}
}

function onInsertText(e: InputEvent, editor: ReactEditor) {
	if (!(editor.selection && e.data)) return;
	const closestPipEntry = Editor.above(editor, {
		match: node => isManaPip(node),
		at: editor.selection,
	});
	if (closestPipEntry) {
		if (/[0-9]/.test(e.data)) return;
		Transforms.splitNodes(editor, { match: (node) => isManaPip(node) });
		const point = editor.start(editor.selection);
		let closestNonPipEntry;
		if (editor.isEnd(point, point.path)) {
			closestNonPipEntry = editor.next({ at: editor.selection, match: (node, path) => Text.isText(node) && !isManaPip(Node.parent(editor, path)) });
		} else {
			closestNonPipEntry = editor.previous({ at: editor.selection, match: (node, path) => Text.isText(node) && !isManaPip(Node.parent(editor, path)) });
		}
		if (!closestNonPipEntry) throw Error("closestNonPipEntry not found. are we not in an inline? there should be one after normalizing");
		const [, path] = closestNonPipEntry;
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
		const letter = e.data.toUpperCase() as keyof typeof colorNamesByLetter;
		const color = colorNamesByLetter[letter];
		Editor.insertNode(editor, {
			type: "ManaPip",
			color: `var(--${color}-mana-background-color)`,
			children: [{ type: "Icon", src: iconUrls[color], alt: letter, children: [{ text: "" }] }],
		});
		// // move outside of node
		// const newClosestPipEntry = Editor.above(editor, {
		// 	match: node => isManaPip(node),
		// 	at: editor.selection,
		// });
		// if (!newClosestPipEntry) {
		// 	console.warn("Can't find pip we just created. Did it get normalized away? Failing gracefully");
		// 	return;
		// }
		// const [, path] = newClosestPipEntry;
		// const point = Editor.after(editor, path)!;
		// Transforms.setSelection(editor, { focus: point, anchor: point });
	}
}
