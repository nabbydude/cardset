import React, { KeyboardEvent, MouseEvent, useCallback, useContext, useLayoutEffect, useMemo } from "react";
import { Editor } from "slate";
import { ReactEditor, Slate } from "slate-react";
import { CardTextControlEditor, createCardTextControlEditor, EditableProps, renderElement, renderLeaf, toggleMark } from "../slate";
import { FocusSendingEditable } from "./FocusSendingEditable";
import { ManaPip } from "./slate/ManaPip";
import { colorNamesByLetter, iconUrls } from "../assets";
import { asScalingPt, getFillSize } from "../autoScaleText";
import { card } from "../card";
import { ProjectContext } from "./contexts/ProjectContext";
import { ControlEditorDirectoryContext } from "./contexts/ControlEditorDirectory";
import { HistoryContext } from "./contexts/HistoryContext";

export interface TextControlProps extends Omit<EditableProps, keyof TextControlEventProps>, TextControlEventProps {
	card: card,
	controlId: string,
	propertyId: string,
	minFontSize: number,
	maxFontSize: number,
}

export interface TextControlEventProps {
	onDOMBeforeInput?: (e: InputEvent   , editor: ReactEditor) => void,
	onClick         ?: (e: MouseEvent   , editor: ReactEditor) => void,
	onKeyDown       ?: (e: KeyboardEvent, editor: ReactEditor) => void,
}

export function TextControl(props: TextControlProps) {
	const { card, controlId, propertyId, minFontSize, maxFontSize, onDOMBeforeInput, onClick, onKeyDown, ...rest } = props;
	const project = useContext(ProjectContext);
	const history = useContext(HistoryContext);
	const control_editor_directory = useContext(ControlEditorDirectoryContext);
	const editor = useMemo(() => {
		let editor = control_editor_directory.get(controlId);
		if (!editor) {
			editor = createCardTextControlEditor(project, history, controlId, card.id, propertyId)
			control_editor_directory.set(controlId, editor);
		}
		return editor;
	},[control_editor_directory.get(controlId)]);
	// const [editor] = useState(() => createCardTextControlEditor(project, history, controlId, card.id, propertyId));
	// useViewOfMatchingNode(editor, project, path, { type: "Field", name: property });

	useLayoutEffect(() => {
		const el = ReactEditor.toDOMNode(editor, editor);
		const size = getFillSize(el, minFontSize, maxFontSize, 0.5);
		el.style.fontSize = asScalingPt(size);
	});

	const thisOnClick          = useCallback((e: MouseEvent   ) => { onClick         ?.(e, editor);                                                               }, [editor, onClick         ]);
	const thisOnKeyDown        = useCallback((e: KeyboardEvent) => { onKeyDown       ?.(e, editor); if(!e.defaultPrevented) onTextControlKeyDown       (e, editor); }, [editor, onKeyDown       ]);
	const thisOnDOMBeforeInput = useCallback((e: InputEvent   ) => { onDOMBeforeInput?.(e, editor); if(!e.defaultPrevented) onTextControlDOMBeforeInput(e, editor); }, [editor, onDOMBeforeInput]);

	return (
		<Slate editor={editor} initialValue={editor.children}>
			<FocusSendingEditable
				className="property"
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onTextControlFieldClick(e: MouseEvent, editor: ReactEditor) {

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
