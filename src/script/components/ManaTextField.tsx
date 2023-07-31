import React, { useCallback } from "react";
import { Editor } from "slate";
import { ReactEditor } from "slate-react";
import { isManaPip } from "./slate/ManaPip";
import { colorNamesByLetter } from "../assets";
import { TextField, TextFieldProps, createGenericPip, createManaPipFromLetter } from "./TextField";

export function ManaTextField(props: TextFieldProps) {
	const { onDOMBeforeInput, ...rest } = props;
	return (
		<TextField
			onDOMBeforeInput={useCallback((e: InputEvent, editor: ReactEditor) => { onDOMBeforeInput?.(e, editor); if(!e.defaultPrevented) onManaTextFieldDOMBeforeInput(e, editor); }, [onDOMBeforeInput])}
			{...rest}
		/>
	);
}

function onManaTextFieldDOMBeforeInput(e: InputEvent, editor: ReactEditor) {
	switch (e.inputType) {
		case "insertText": return onInsertText(e, editor);
	}
}

function onInsertText(e: InputEvent, editor: ReactEditor) {
	if (!(editor.selection && e.data)) return;
	const closestPipEntry = Editor.above(editor, { match: node => isManaPip(node) });
	if (closestPipEntry && !/[WUBRGC]/i.test(e.data)) return; // type in the existing pip

	e.preventDefault();

	let node;
	if (/[WUBRGC]/i.test(e.data)) {
		node = createManaPipFromLetter(e.data.toUpperCase() as keyof typeof colorNamesByLetter);
	} else {
		node = createGenericPip(e.data);
	}
	editor.insertNode(node, { match: closestPipEntry && ((n) => isManaPip(n)), select: true });
}
