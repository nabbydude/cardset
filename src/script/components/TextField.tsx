import React, { KeyboardEvent, MouseEvent, useCallback, useLayoutEffect } from "react";
import { useState } from "react";
import { Editor, Path } from "slate";
import { ReactEditor, Slate } from "slate-react";
import { CardFieldEditor, createCardFieldEditor, CustomEditor, EditableProps, renderElement, renderLeaf, useViewOfMatchingNode } from "../slate";
import { useDocument } from "./contexts/DocumentContext";
import { asScalingPt, getFillSize } from "../util";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { ManaPip } from "./slate/ManaPip";
import { colorNamesByLetter, iconUrls } from "../colorAssets";

export interface TextFieldProps extends EditableProps {
	cardPath: Path,
	field: string,
	minFontSize: number,
	maxFontSize: number,

	onEditableDOMBeforeInput?: (e: InputEvent, editor: ReactEditor) => void,
	onEditableClick?: (e: MouseEvent, editor: ReactEditor) => void,
	onEditableKeyDown?: (e: KeyboardEvent, editor: ReactEditor) => void,
}

export function TextField(props: TextFieldProps) {
	const { cardPath, field, minFontSize, maxFontSize, onEditableDOMBeforeInput, onEditableClick, onEditableKeyDown, ...rest } = props;
	const doc = useDocument();
	const [editor] = useState(() => {
		const e = createCardFieldEditor();
		// for debugging
		// todo: implement this properly, you lazy bum
		/* eslint-disable @typescript-eslint/no-explicit-any */
		(e as any).meta ??= {};
		(e as any).meta.cardPath = cardPath;
		(e as any).meta.field = field;
		/* eslint-enable @typescript-eslint/no-explicit-any */
		return e;
	});
	useViewOfMatchingNode(editor, doc, cardPath, { type: "Field", name: field });

	useLayoutEffect(() => {
		const el = ReactEditor.toDOMNode(editor, editor);
		const size = getFillSize(el, minFontSize, maxFontSize, 0.5);
		el.style.fontSize = asScalingPt(size);
	});

	return (
		<Slate editor={editor} initialValue={editor.children}>
			<FocusSendingEditable
				className="field"
				data-field-name={field}
				renderElement={renderElement}
				renderLeaf={renderLeaf}
				onClick         ={useCallback((e: MouseEvent   ) => { onEditableClick         ?.(e, editor); if(!e.defaultPrevented) onClick         (e, editor); }, [editor, onEditableClick         ])}
				onKeyDown       ={useCallback((e: KeyboardEvent) => { onEditableKeyDown       ?.(e, editor); if(!e.defaultPrevented) onKeyDown       (e, editor); }, [editor, onEditableKeyDown       ])}
				onDOMBeforeInput={useCallback((e: InputEvent   ) => { onEditableDOMBeforeInput?.(e, editor); if(!e.defaultPrevented) onDOMBeforeInput(e, editor); }, [editor, onEditableDOMBeforeInput])}
				disableDefaultStyles={true}
				style={{
					whiteSpace: "pre-wrap",
					wordWrap: "break-word",
				}}
				{...rest}
			/>
		</Slate>
	);
}

function onKeyDown(e: KeyboardEvent, editor: Editor) {
	if (e.ctrlKey) {
		switch (e.key) {
			case "b": e.preventDefault(); CustomEditor.toggleBoldMark(editor); break;
			case "i": e.preventDefault(); CustomEditor.toggleItalicMark(editor); break;
		}
	}

	switch (e.key) {
		case "ArrowRight": (editor as CardFieldEditor).nudgeDirection = "forward" ; break;
		case "ArrowLeft" : (editor as CardFieldEditor).nudgeDirection = "backward"; break;
	}
}

function onDOMBeforeInput(e: InputEvent, editor: ReactEditor) {
	switch (e.inputType) {
		case "insertText": return onInsertText(e, editor);
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onClick(e: MouseEvent, editor: ReactEditor) {

}

function onInsertText(e: InputEvent, editor: ReactEditor & CardFieldEditor) {
	editor.actionSource = "user";
}

export function createManaPipFromLetter(letter: keyof typeof colorNamesByLetter): ManaPip {
	const color = colorNamesByLetter[letter];
	return {
		type: "ManaPip",
		color: `var(--${color}-mana-background-color)`,
		children: [{ type: "Icon", src: iconUrls[color], alt: letter, children: [{ text: "" }] }],
	};
}

export function createGenericPip(text: string): ManaPip {
	return {
		type: "ManaPip",
		color: "var(--generic-mana-background-color)",
		children: [{ text }],
	};
}
