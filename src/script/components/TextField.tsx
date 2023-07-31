import React, { KeyboardEvent, MouseEvent, useCallback, useLayoutEffect } from "react";
import { useState } from "react";
import { Editor, NodeEntry } from "slate";
import { ReactEditor, Slate } from "slate-react";
import { CardFieldEditor, createCardFieldEditor, EditableProps, renderElement, renderLeaf, toggleMark } from "../slate";
import { useDocument } from "./contexts/DocumentContext";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { ManaPip } from "./slate/ManaPip";
import { colorNamesByLetter, iconUrls } from "../assets";
import { Card } from "./slate/Card";
import { useViewOfMatchingNode } from "../multiSlate";
import { asScalingPt, getFillSize } from "../autoScaleText";

export interface TextFieldProps extends Omit<EditableProps, keyof TextFieldEventProps>, TextFieldEventProps {
	cardEntry: NodeEntry<Card>,
	field: string,
	minFontSize: number,
	maxFontSize: number,
}

export interface TextFieldEventProps {
	onDOMBeforeInput?: (e: InputEvent   , editor: ReactEditor) => void,
	onClick         ?: (e: MouseEvent   , editor: ReactEditor) => void,
	onKeyDown       ?: (e: KeyboardEvent, editor: ReactEditor) => void,
}

export function TextField(props: TextFieldProps) {
	const { cardEntry, field, minFontSize, maxFontSize, onDOMBeforeInput, onClick, onKeyDown, ...rest } = props;
	const [, path] = cardEntry;
	const doc = useDocument();
	const [editor] = useState(createCardFieldEditor);
	useViewOfMatchingNode(editor, doc, path, { type: "Field", name: field });

	useLayoutEffect(() => {
		const el = ReactEditor.toDOMNode(editor, editor);
		const size = getFillSize(el, minFontSize, maxFontSize, 0.5);
		el.style.fontSize = asScalingPt(size);
	});

	const thisOnClick          = useCallback((e: MouseEvent   ) => { onClick         ?.(e, editor);                                                               }, [editor, onClick         ]);
	const thisOnKeyDown        = useCallback((e: KeyboardEvent) => { onKeyDown       ?.(e, editor); if(!e.defaultPrevented) onTextFieldKeyDown       (e, editor); }, [editor, onKeyDown       ]);
	const thisOnDOMBeforeInput = useCallback((e: InputEvent   ) => { onDOMBeforeInput?.(e, editor); if(!e.defaultPrevented) onTextFieldDOMBeforeInput(e, editor); }, [editor, onDOMBeforeInput]);

	return (
		<Slate editor={editor} initialValue={editor.children}>
			<FocusSendingEditable
				className="field"
				data-field-name={field}
				renderElement={renderElement}
				renderLeaf={renderLeaf}
				onClick={thisOnClick}
				onKeyDown={thisOnKeyDown}
				onDOMBeforeInput={thisOnDOMBeforeInput}
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

function onTextFieldKeyDown(e: KeyboardEvent, editor: Editor) {
	if (e.ctrlKey) {
		switch (e.key) {
			case "b": e.preventDefault(); toggleMark(editor, "bold"  ); break;
			case "i": e.preventDefault(); toggleMark(editor, "italic"); break;
		}
	}

	switch (e.key) {
		case "ArrowRight": (editor as CardFieldEditor).nudgeDirection = "forward" ; break;
		case "ArrowLeft" : (editor as CardFieldEditor).nudgeDirection = "backward"; break;
	}
}

function onTextFieldDOMBeforeInput(e: InputEvent, editor: ReactEditor) {
	switch (e.inputType) {
		case "insertText": return onInsertText(e, editor);
	}
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onTextFieldClick(e: MouseEvent, editor: ReactEditor) {

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

export function createTapPip(): ManaPip {
	return {
		type: "ManaPip",
		color: "var(--generic-mana-background-color)",
		children: [{ type: "Icon", src: iconUrls.tap, alt: "T", children: [{ text: "" }] }],
	};
}
