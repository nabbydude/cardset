import React from "react";
import { ReactEditor } from "slate-react";
import { colorNamesByLetter } from "../assets";
import { useToastedCallback } from "../toaster";
import { isManaPip } from "./slate/ManaPip";
import { TextControl, TextControlProps, createGenericPip, createManaPipFromLetter } from "./TextControl";

export function ManaTextControl(props: TextControlProps) {
	const { onDOMBeforeInput, ...rest } = props;
	return (
		<TextControl
			onDOMBeforeInput={useToastedCallback((e: InputEvent, editor: ReactEditor) => { onDOMBeforeInput?.(e, editor); if(!e.defaultPrevented) onManaTextControlDOMBeforeInput(e, editor); }, [onDOMBeforeInput])}
			{...rest}
		/>
	);
}

function onManaTextControlDOMBeforeInput(e: InputEvent, editor: ReactEditor) {
	switch (e.inputType) {
		case "insertText": return onInsertText(e, editor);
	}
}

function onInsertText(e: InputEvent, editor: ReactEditor) {
	if (!(editor.selection && e.data)) return;
	const closestPipEntry = editor.above({ at: editor.selection, match: node => isManaPip(node) });
	const isManaTypeLetter = /[WUBRGC]/i.test(e.data);
	if (closestPipEntry && !isManaTypeLetter) return; // type in the existing pip

	e.preventDefault();

	let node;
	if (isManaTypeLetter) {
		node = createManaPipFromLetter(e.data.toUpperCase() as keyof typeof colorNamesByLetter);
	} else {
		node = createGenericPip(e.data);
	}
	// editor.insertNode(node, { at: editor.selection, match: closestPipEntry && ((n) => isManaPip(n)), select: true });
	editor.insertNodes([node, { text: "" }], { at: editor.selection, match: closestPipEntry && ((n) => isManaPip(n)), select: true });
	console.log(editor.selection);
	console.log(editor.children);
}
