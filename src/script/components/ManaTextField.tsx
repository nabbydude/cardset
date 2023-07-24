import React, { KeyboardEvent, useCallback } from "react";
import { Editor } from "slate";
import { ReactEditor } from "slate-react";
import { isManaPip } from "./slate/ManaPip";
import { colorNamesByLetter } from "../colorAssets";
import { TextField, TextFieldProps, createGenericPip, createManaPipFromLetter } from "./TextField";
import { CardFieldEditor } from "../slate";

// export interface ManaTextFieldProps extends TextFieldProps {

// }

export function ManaTextField(props: TextFieldProps) {
	const { onEditableDOMBeforeInput, onEditableKeyDown, ...rest } = props;
	return (
		<TextField
			onEditableDOMBeforeInput={useCallback((e: InputEvent, editor: ReactEditor) => { onEditableDOMBeforeInput?.(e, editor); if(!e.defaultPrevented) onDOMBeforeInput(e, editor); }, [onEditableDOMBeforeInput])}
			onEditableKeyDown={useCallback((e: KeyboardEvent, editor: ReactEditor) => { onEditableKeyDown?.(e, editor); if(!e.defaultPrevented) onKeyDown(e, editor); }, [onEditableDOMBeforeInput])}
			{...rest}
		/>
	);
}

function onDOMBeforeInput(e: InputEvent, editor: ReactEditor) {
	switch (e.inputType) {
		case "insertText": return onInsertText(e, editor);
	}
}

function onKeyDown(e: KeyboardEvent, editor: ReactEditor) {
	switch (e.key) {
		case "ArrowRight": (editor as CardFieldEditor).nudgeDirection = "forward"; break;
		case "ArrowLeft": (editor as CardFieldEditor).nudgeDirection = "backward"; break;
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
