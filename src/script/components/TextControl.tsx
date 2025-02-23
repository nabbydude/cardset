import React, { KeyboardEvent, MouseEvent, useCallback, useLayoutEffect } from "react";
import { Editor } from "slate";
import { ReactEditor, Slate } from "slate-react";
import { TextControlEditor, EditableProps, safeToDomNode, toggleMark } from "../slate";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { ManaPip } from "./slate/ManaPip";
import { colorNamesByLetter, iconUrls } from "../assets";
import { asScalingPt, getFillSize } from "../autoScaleText";
import { card } from "../card";
import { useTextControlEditor } from "./hooks/useTextControlEditor";
import { text_control } from "../control";
import { RenderElement } from "./slate/RenderElement";
import { RenderLeaf } from "./slate/RenderLeaf";

export interface TextControlProps extends Omit<EditableProps, "property" | keyof TextControlEventProps>, TextControlEventProps {
	card: card,
	control: text_control,
}

export interface TextControlEventProps {
	onDOMBeforeInput?: (e: InputEvent   , editor: ReactEditor) => void,
	onClick         ?: (e: MouseEvent   , editor: ReactEditor) => void,
	onKeyDown       ?: (e: KeyboardEvent, editor: ReactEditor) => void,
}

export function TextControl(props: TextControlProps) {
	const { card, control, onDOMBeforeInput, onClick, onKeyDown, ...rest } = props;
	const editor = useTextControlEditor(card, control);
	useLayoutEffect(() => {
		const el = safeToDomNode(editor, editor);
		if (!el) return;
		const size = getFillSize(el, control.min_font_size, control.max_font_size, 0.5);
		el.style.fontSize = asScalingPt(size);
	});

	const thisOnClick          = useCallback((e: MouseEvent   ) => { onClick         ?.(e, editor);                                                               }, [editor, onClick         ]);
	const thisOnKeyDown        = useCallback((e: KeyboardEvent) => { onKeyDown       ?.(e, editor); if(!e.defaultPrevented) onTextControlKeyDown       (e, editor); }, [editor, onKeyDown       ]);
	const thisOnDOMBeforeInput = useCallback((e: InputEvent   ) => { onDOMBeforeInput?.(e, editor); if(!e.defaultPrevented) onTextControlDOMBeforeInput(e, editor); }, [editor, onDOMBeforeInput]);

	return (
		<Slate editor={editor} initialValue={editor.children}>
			<FocusSendingEditable
				className="text_control"
				data-card-id={card.id}
				data-control-id={control.id}
				renderElement={RenderElement}
				renderLeaf={RenderLeaf}
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
}

function onTextControlDOMBeforeInput(e: InputEvent, editor: ReactEditor & TextControlEditor) {
	switch (e.inputType) {
		case "insertText": return onTextControlInsertText(e, editor);
	}
}

function onTextControlInsertText(e: InputEvent, editor: ReactEditor & TextControlEditor) {
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
