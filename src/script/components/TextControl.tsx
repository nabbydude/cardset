import React, { KeyboardEvent, MouseEvent, useCallback, useLayoutEffect } from "react";
import { Editor } from "slate";
import { ReactEditor, Slate } from "slate-react";
import { CardTextControlEditor, EditableProps, renderElement, renderLeaf, safeToDomNode, toggleMark, toSingleLinePlaintext } from "../slate";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { ManaPip } from "./slate/ManaPip";
import { colorNamesByLetter, iconUrls } from "../assets";
import { asScalingPt, getFillSize } from "../autoScaleText";
import { card } from "../card";
import { useCardTextControlEditor } from "./hooks/useTextControlEditor";
import { text_property } from "../property";

export interface TextControlProps extends Omit<EditableProps, "property" | keyof TextControlEventProps>, TextControlEventProps {
	card: card,
	controlId: string,
	property: text_property,
	minFontSize: number,
	maxFontSize: number,
}

export interface TextControlEventProps {
	onDOMBeforeInput?: (e: InputEvent   , editor: ReactEditor) => void,
	onClick         ?: (e: MouseEvent   , editor: ReactEditor) => void,
	onKeyDown       ?: (e: KeyboardEvent, editor: ReactEditor) => void,
}

export function TextControl(props: TextControlProps) {
	const { card, controlId, property, minFontSize, maxFontSize, onDOMBeforeInput, onClick, onKeyDown, ...rest } = props;
	const editor = useCardTextControlEditor(card, controlId, property);
	useLayoutEffect(() => {
		const el = safeToDomNode(editor, editor);
		if (!el) return;
		const size = getFillSize(el, minFontSize, maxFontSize, 0.5);
		el.style.fontSize = asScalingPt(size);
	});

	const thisOnClick          = useCallback((e: MouseEvent   ) => { onClick         ?.(e, editor);                                                               }, [editor, onClick         ]);
	const thisOnKeyDown        = useCallback((e: KeyboardEvent) => { onKeyDown       ?.(e, editor); if(!e.defaultPrevented) onTextControlKeyDown       (e, editor); }, [editor, onKeyDown       ]);
	const thisOnDOMBeforeInput = useCallback((e: InputEvent   ) => { onDOMBeforeInput?.(e, editor); if(!e.defaultPrevented) onTextControlDOMBeforeInput(e, editor); }, [editor, onDOMBeforeInput]);
	
	// console.log(toSingleLinePlaintext(editor.children));

	return (
		<Slate editor={editor} initialValue={editor.children}>
			<FocusSendingEditable
				className="property"
				data-card-id={card.id}
				data-control-id={controlId}
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

function onTextControlKeyDown(e: KeyboardEvent, editor: Editor) {
	if (e.ctrlKey) {
		switch (e.key) {
			case "b": e.preventDefault(); toggleMark(editor, "bold"  ); break;
			case "i": e.preventDefault(); toggleMark(editor, "italic"); break;
		}
	}

	switch (e.key) {
		case "ArrowRight": (editor as CardTextControlEditor).nudgeDirection = "forward" ; break;
		case "ArrowLeft" : (editor as CardTextControlEditor).nudgeDirection = "backward"; break;
	}
}

function onTextControlDOMBeforeInput(e: InputEvent, editor: ReactEditor & CardTextControlEditor) {
	switch (e.inputType) {
		case "insertText": return onTextControlInsertText(e, editor);
	}
}

function onTextControlInsertText(e: InputEvent, editor: ReactEditor & CardTextControlEditor) {
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
